import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  clampSeconds,
  isEngagementKind,
  readDedupKey,
  MAX_ENGAGED_SECONDS,
} from '../../functions/_lib/engagement';
import { onRequestPost, _clearManifestCache } from '../../functions/api/engagement';

/**
 * Cookieless engagement instrumentation (#224) — pure helpers + the endpoint's security/dedup/counter
 * behavior. Mirrors tests/security/view.test.ts (mock D1 + stubbed manifest fetch).
 */

describe('engagement helpers', () => {
  it('clampSeconds floors valid samples and rejects junk / out-of-range', () => {
    expect(clampSeconds(42)).toBe(42);
    expect(clampSeconds(42.9)).toBe(42);
    expect(clampSeconds('30')).toBe(30);
    expect(clampSeconds(0)).toBe(0);
    expect(clampSeconds(0.4)).toBe(0);
    expect(clampSeconds(-5)).toBe(0);
    expect(clampSeconds('nope')).toBe(0);
    expect(clampSeconds(undefined)).toBe(0);
    expect(clampSeconds(999999)).toBe(MAX_ENGAGED_SECONDS);
  });

  it('isEngagementKind only accepts the two known kinds', () => {
    expect(isEngagementKind('engaged')).toBe(true);
    expect(isEngagementKind('read')).toBe(true);
    expect(isEngagementKind('view')).toBe(false);
    expect(isEngagementKind('')).toBe(false);
    expect(isEngagementKind(null)).toBe(false);
  });

  it('readDedupKey is deterministic, varies by input, and differs from the view key', async () => {
    const k = await readDedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA');
    expect(await readDedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA')).toBe(k);
    expect(await readDedupKey('salt', '/en/blog/y', '1.2.3.4', 'UA')).not.toBe(k);
    expect(await readDedupKey('salt', '/en/blog/x', '9.9.9.9', 'UA')).not.toBe(k);
    expect(k).toMatch(/^[0-9a-f]{64}$/);
  });
});

// --- endpoint behavior (stateful mock D1 + stubbed manifest fetch) ---

/**
 * Stateful mock: tracks the rate-limit window count, the dedup ledger, and the counters table so the
 * tests can assert dedup AND the increment-by-N upsert (engaged_seconds += seconds).
 */
function mockDB() {
  const rl = new Map<string, number>();
  const dedup = new Set<string>();
  const counters = new Map<string, number>(); // `${slug}\n${kind}` → count
  const make = (sql: string) => {
    let args: unknown[] = [];
    const stmt = {
      bind(...vals: unknown[]) {
        args = vals;
        return stmt;
      },
      async run() {
        if (sql.includes('INSERT INTO dedup')) {
          const hash = String(args[0]);
          if (dedup.has(hash)) return { meta: { changes: 0 } };
          dedup.add(hash);
          return { meta: { changes: 1 } };
        }
        if (sql.includes('INSERT INTO counters')) {
          const key = `${args[0]}\n${args[1]}`;
          const by = Number(args[2]);
          counters.set(key, (counters.get(key) ?? 0) + by);
        }
        return { meta: { changes: 0 } };
      },
      // The shared rate limiter upserts `ratelimit … RETURNING count`; climbs so a flood eventually trips.
      async first<T>() {
        const key = String(args[0]);
        const next = (rl.get(key) ?? 0) + 1;
        rl.set(key, next);
        return { count: next } as T;
      },
    };
    return stmt;
  };
  return { prepare: (sql: string) => make(sql), counters };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://rsicarelli.com/api/engagement', {
    method: 'POST',
    headers: {
      origin: 'https://rsicarelli.com',
      'user-agent': 'Mozilla/5.0 (X11) Firefox/130',
      'cf-connecting-ip': '1.2.3.4',
      'content-type': 'application/json',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/engagement', () => {
  beforeEach(() => {
    _clearManifestCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ paths: ['/en/blog/x'] }))),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects a cross-origin beacon', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'read' }, { origin: 'https://evil.example' }),
      env: { DB: mockDB(), VIEW_SALT_SECRET: 's' },
    });
    expect((await res.json()).ok).toBe(false);
  });

  it('400s on an unknown kind', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'bogus' }),
      env: { DB: mockDB(), VIEW_SALT_SECRET: 's' },
    });
    expect(res.status).toBe(400);
  });

  it('400s on a malformed body', async () => {
    const res = await onRequestPost({
      request: post('{not json', {}),
      env: { DB: mockDB(), VIEW_SALT_SECRET: 's' },
    });
    expect(res.status).toBe(400);
  });

  it('ignores a path that is not an allowlisted post (204)', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/not-real', kind: 'read' }),
      env: { DB: mockDB(), VIEW_SALT_SECRET: 's' },
    });
    expect(res.status).toBe(204);
  });

  it('counts a fresh read-complete, then dedups the repeat', async () => {
    const db = mockDB();
    const env = { DB: db, VIEW_SALT_SECRET: 's' };
    const first = await onRequestPost({ request: post({ path: '/en/blog/x', kind: 'read' }), env });
    expect((await first.json()).counted).toBe(true);
    expect(db.counters.get('/en/blog/x\nread_complete')).toBe(1);

    const repeat = await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'read' }),
      env,
    });
    expect((await repeat.json()).counted).toBe(false);
    expect(db.counters.get('/en/blog/x\nread_complete')).toBe(1); // still 1
  });

  it('sums engaged seconds and bumps the sample count (no dedup)', async () => {
    const db = mockDB();
    const env = { DB: db, VIEW_SALT_SECRET: 's' };
    await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'engaged', seconds: 30 }),
      env,
    });
    await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'engaged', seconds: 45 }),
      env,
    });
    expect(db.counters.get('/en/blog/x\nengaged_seconds')).toBe(75);
    expect(db.counters.get('/en/blog/x\nengaged_samples')).toBe(2);
  });

  it('clamps an inflated engaged sample to MAX_ENGAGED_SECONDS', async () => {
    const db = mockDB();
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'engaged', seconds: 999999 }),
      env: { DB: db, VIEW_SALT_SECRET: 's' },
    });
    expect((await res.json()).counted).toBe(true);
    expect(db.counters.get('/en/blog/x\nengaged_seconds')).toBe(MAX_ENGAGED_SECONDS);
  });

  it('does not record a sub-second engaged sample', async () => {
    const db = mockDB();
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'engaged', seconds: 0 }),
      env: { DB: db, VIEW_SALT_SECRET: 's' },
    });
    expect((await res.json()).counted).toBe(false);
    expect(db.counters.has('/en/blog/x\nengaged_seconds')).toBe(false);
  });

  it('does not count bots', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', kind: 'read' }, { 'user-agent': 'Googlebot/2.1' }),
      env: { DB: mockDB(), VIEW_SALT_SECRET: 's' },
    });
    expect((await res.json()).counted).toBe(false);
  });

  it('429s once the per-IP rate limit is exceeded', async () => {
    const env = { DB: mockDB(), VIEW_SALT_SECRET: 's' };
    let last: Response | undefined;
    for (let i = 0; i < 61; i++)
      last = await onRequestPost({
        request: post({ path: '/en/blog/x', kind: 'engaged', seconds: 5 }),
        env,
      });
    expect(last!.status).toBe(429);
  });
});
