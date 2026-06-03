import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  normalizePath,
  isBotUA,
  isSameOrigin,
  utcDate,
  dailySalt,
  dedupKey,
} from '../../functions/_lib/view';
import { onRequestPost, onRequestGet, _clearManifestCache } from '../../functions/api/view';

/**
 * Cookieless view counter (#200) — pure helpers + the endpoint's security/dedup behavior.
 */

describe('view helpers', () => {
  it('normalizePath adds a leading slash and drops a trailing one', () => {
    expect(normalizePath('/en/blog/x/')).toBe('/en/blog/x');
    expect(normalizePath('en/blog/x')).toBe('/en/blog/x');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('')).toBe('');
  });

  it('isBotUA flags crawlers and empty UAs, passes real browsers', () => {
    for (const ua of ['', 'Googlebot/2.1', 'facebookexternalhit/1.1', 'HeadlessChrome/120'])
      expect(isBotUA(ua), ua).toBe(true);
    expect(isBotUA('Mozilla/5.0 (Macintosh) Safari/605')).toBe(false);
  });

  it('isSameOrigin only accepts a matching Origin header', () => {
    const url = 'https://rsicarelli.com/api/view';
    expect(isSameOrigin('https://rsicarelli.com', url)).toBe(true);
    expect(isSameOrigin('https://evil.example', url)).toBe(false);
    expect(isSameOrigin(null, url)).toBe(false);
  });

  it('dailySalt is stable per (secret, date) and changes with either', async () => {
    const a = await dailySalt('s', '2026-06-03');
    expect(await dailySalt('s', '2026-06-03')).toBe(a);
    expect(await dailySalt('s', '2026-06-04')).not.toBe(a);
    expect(await dailySalt('other', '2026-06-03')).not.toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('dedupKey is deterministic and varies by every input', async () => {
    const k = await dedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA');
    expect(await dedupKey('salt', '/en/blog/x', '1.2.3.4', 'UA')).toBe(k);
    expect(await dedupKey('salt', '/en/blog/y', '1.2.3.4', 'UA')).not.toBe(k);
    expect(await dedupKey('salt', '/en/blog/x', '9.9.9.9', 'UA')).not.toBe(k);
  });

  it('utcDate is YYYY-MM-DD', () => {
    expect(utcDate(new Date('2026-06-03T23:59:00Z'))).toBe('2026-06-03');
  });
});

// --- endpoint behavior (mock D1 + stubbed manifest fetch) ---

function mockDB(inserted: boolean, views = 0) {
  const stmt = {
    bind() {
      return stmt;
    },
    async run() {
      return { meta: { changes: inserted ? 1 : 0 } };
    },
    async first() {
      return { count: views };
    },
  };
  return { prepare: () => stmt };
}

const post = (path: unknown, headers: Record<string, string> = {}) =>
  new Request('https://rsicarelli.com/api/view', {
    method: 'POST',
    headers: {
      origin: 'https://rsicarelli.com',
      'user-agent': 'Mozilla/5.0 (X11) Firefox/130',
      'cf-connecting-ip': '1.2.3.4',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ path }),
  });

describe('POST /api/view', () => {
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
      request: post('/en/blog/x', { origin: 'https://evil.example' }),
      env: { DB: mockDB(true), VIEW_SALT_SECRET: 's' },
    });
    expect((await res.json()).ok).toBe(false);
  });

  it('ignores a path that is not an allowlisted post (204)', async () => {
    const res = await onRequestPost({
      request: post('/en/blog/not-real'),
      env: { DB: mockDB(true), VIEW_SALT_SECRET: 's' },
    });
    expect(res.status).toBe(204);
  });

  it('counts a fresh allowlisted view, then dedups the repeat', async () => {
    const first = await onRequestPost({
      request: post('/en/blog/x'),
      env: { DB: mockDB(true), VIEW_SALT_SECRET: 's' },
    });
    expect((await first.json()).counted).toBe(true);

    const repeat = await onRequestPost({
      request: post('/en/blog/x'),
      env: { DB: mockDB(false), VIEW_SALT_SECRET: 's' },
    });
    expect((await repeat.json()).counted).toBe(false);
  });

  it('does not count bots', async () => {
    const res = await onRequestPost({
      request: post('/en/blog/x', { 'user-agent': 'Googlebot/2.1' }),
      env: { DB: mockDB(true), VIEW_SALT_SECRET: 's' },
    });
    expect((await res.json()).counted).toBe(false);
  });
});

describe('GET /api/view', () => {
  beforeEach(() => {
    _clearManifestCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ paths: ['/en/blog/x'] }))),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns the aggregate for an allowlisted path', async () => {
    const res = await onRequestGet({
      request: new Request('https://rsicarelli.com/api/view?path=/en/blog/x'),
      env: { DB: mockDB(false, 42) },
    });
    expect(await res.json()).toMatchObject({ path: '/en/blog/x', views: 42 });
  });

  it('404s an unknown path', async () => {
    const res = await onRequestGet({
      request: new Request('https://rsicarelli.com/api/view?path=/en/blog/nope'),
      env: { DB: mockDB(false) },
    });
    expect(res.status).toBe(404);
  });
});
