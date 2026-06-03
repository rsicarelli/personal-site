import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isValidEmoji,
  parseReactBody,
  reactDedupKey,
  countsFromRows,
  REACTION_EMOJI,
} from '../../functions/_lib/react';
import { onRequestPost, onRequestGet, _clearManifestCache } from '../../functions/api/react';

/**
 * Anonymous reactions (#201) — pure helpers + the endpoint's allowlist/dedup/rate-limit behavior.
 */

describe('react helpers', () => {
  it('isValidEmoji accepts only the fixed palette', () => {
    for (const e of REACTION_EMOJI) expect(isValidEmoji(e)).toBe(true);
    for (const e of ['🐍', '', 'x', '👍👍', undefined, 42]) expect(isValidEmoji(e)).toBe(false);
  });

  it('parseReactBody reads path + emoji from JSON', async () => {
    const req = new Request('https://x/api/react', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/en/blog/x', emoji: '🎉' }),
    });
    expect(await parseReactBody(req)).toEqual({ path: '/en/blog/x', emoji: '🎉' });
  });

  it('reactDedupKey is deterministic and varies by emoji (and every input)', async () => {
    const k = await reactDedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA', '👍');
    expect(await reactDedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA', '👍')).toBe(k);
    expect(await reactDedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA', '🎉')).not.toBe(k);
    expect(await reactDedupKey('salt', '/en/blog/y', '1.2.3.4', 'UA', '👍')).not.toBe(k);
    expect(k).toMatch(/^[0-9a-f]{64}$/);
  });

  it('countsFromRows zero-fills the full palette', () => {
    expect(countsFromRows([{ emoji: '👍', count: 3 }])).toEqual({
      '👍': 3,
      '🎉': 0,
      '❤️': 0,
      '🚀': 0,
    });
    // unknown emoji is ignored
    expect(countsFromRows([{ emoji: '🐍', count: 9 }])['🐍' as keyof object]).toBeUndefined();
  });
});

// --- endpoint behavior (mock D1 + stubbed manifest fetch) ---

/** A stateful mock D1 that routes by SQL: ratelimit upsert (RETURNING count), dedup, reactions, SELECT. */
function mockDB() {
  const rl = new Map<string, number>();
  const dedup = new Set<string>();
  const reactions = new Map<string, number>(); // `${slug}\n${emoji}` → count
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
        if (sql.includes('INSERT INTO reactions')) {
          const key = `${args[0]}\n${args[1]}`;
          reactions.set(key, (reactions.get(key) ?? 0) + 1);
        }
        return {};
      },
      async first<T>() {
        // ratelimit upsert … RETURNING count
        const key = String(args[0]);
        const next = (rl.get(key) ?? 0) + 1;
        rl.set(key, next);
        return { count: next } as T;
      },
      async all<T>() {
        const slug = String(args[0]);
        const results = [...reactions.entries()]
          .filter(([k]) => k.startsWith(`${slug}\n`))
          .map(([k, count]) => ({ emoji: k.split('\n')[1], count }));
        return { results: results as T[] };
      },
    };
    return stmt;
  };
  return { prepare: (sql: string) => make(sql) };
}

const ORIGIN = 'https://rsicarelli.com';
const post = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Request(`${ORIGIN}/api/react`, {
    method: 'POST',
    headers: {
      origin: ORIGIN,
      'user-agent': 'Mozilla/5.0 (X11) Firefox/130',
      'cf-connecting-ip': '1.2.3.4',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
const env = () => ({ DB: mockDB(), VIEW_SALT_SECRET: 's' });

describe('/api/react', () => {
  beforeEach(() => {
    _clearManifestCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ paths: ['/en/blog/x'] }))),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects a cross-origin write (403)', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', emoji: '👍' }, { origin: 'https://evil.example' }),
      env: env(),
    });
    expect(res.status).toBe(403);
  });

  it('rejects an emoji outside the palette (400)', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', emoji: '🐍' }),
      env: env(),
    });
    expect(res.status).toBe(400);
  });

  it('ignores a path that is not an allowlisted post (204)', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/not-real', emoji: '👍' }),
      env: env(),
    });
    expect(res.status).toBe(204);
  });

  it('does not count bots', async () => {
    const res = await onRequestPost({
      request: post({ path: '/en/blog/x', emoji: '👍' }, { 'user-agent': 'Googlebot/2.1' }),
      env: env(),
    });
    expect((await res.json()).counted).toBe(false);
  });

  it('counts a fresh reaction, then dedups the repeat — counts reflect a single increment', async () => {
    const e = env();
    const first = await onRequestPost({
      request: post({ path: '/en/blog/x', emoji: '👍' }),
      env: e,
    });
    const firstBody = await first.json();
    expect(firstBody.counted).toBe(true);
    expect(firstBody.counts['👍']).toBe(1);

    const repeat = await onRequestPost({
      request: post({ path: '/en/blog/x', emoji: '👍' }),
      env: e,
    });
    const repeatBody = await repeat.json();
    expect(repeatBody.counted).toBe(false);
    expect(repeatBody.counts['👍']).toBe(1); // dedup → still 1
  });

  it('429s once the per-IP rate limit is exceeded', async () => {
    const e = env();
    let last: Response | undefined;
    // limit is 60/min; fire 61 distinct emojis-cycling requests in the same window.
    for (let i = 0; i < 61; i++) {
      last = await onRequestPost({
        request: post({ path: '/en/blog/x', emoji: REACTION_EMOJI[i % REACTION_EMOJI.length] }),
        env: e,
      });
    }
    expect(last!.status).toBe(429);
  });

  it('GET returns the zero-filled counts map for an allowlisted path', async () => {
    const res = await onRequestGet({
      request: new Request(`${ORIGIN}/api/react?path=/en/blog/x`),
      env: env(),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.path).toBe('/en/blog/x');
    expect(body.counts).toEqual({ '👍': 0, '🎉': 0, '❤️': 0, '🚀': 0 });
  });

  it('GET 204s for a non-allowlisted path', async () => {
    const res = await onRequestGet({
      request: new Request(`${ORIGIN}/api/react?path=/en/blog/nope`),
      env: env(),
    });
    expect(res.status).toBe(204);
  });
});
