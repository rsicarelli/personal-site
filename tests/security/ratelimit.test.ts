import { describe, it, expect } from 'vitest';
import {
  windowStart,
  rateLimitKey,
  checkRateLimit,
  type RateLimitDB,
  type RateLimitStmt,
} from '../../functions/_lib/ratelimit';

/**
 * Per-IP rate limiter (#202) — pure window math + the upsert/limit behavior against a mock D1.
 */

describe('rate-limit helpers', () => {
  it('windowStart floors to the window boundary', () => {
    expect(windowStart(125, 60)).toBe(120);
    expect(windowStart(120, 60)).toBe(120);
    expect(windowStart(179, 60)).toBe(120);
    expect(windowStart(180, 60)).toBe(180);
  });

  it('rateLimitKey is stable per (ip, bucket, window) and varies by each', async () => {
    const k = await rateLimitKey('salt', '1.2.3.4', 'react', 120);
    expect(await rateLimitKey('salt', '1.2.3.4', 'react', 120)).toBe(k);
    expect(await rateLimitKey('salt', '9.9.9.9', 'react', 120)).not.toBe(k);
    expect(await rateLimitKey('salt', '1.2.3.4', 'view', 120)).not.toBe(k);
    expect(await rateLimitKey('salt', '1.2.3.4', 'react', 180)).not.toBe(k);
    expect(k).toMatch(/^[0-9a-f]{64}$/);
  });
});

// --- behavior against a mock D1 that implements the RETURNING-count upsert ---

function mockDB(): RateLimitDB {
  const table = new Map<string, number>();
  const make = (): RateLimitStmt => {
    let args: unknown[] = [];
    const stmt: RateLimitStmt = {
      bind(...vals: unknown[]) {
        args = vals;
        return stmt;
      },
      async run() {
        // The opportunistic prune only deletes EXPIRED windows (`ts < now - 2*window`); the active
        // window's rows always survive, so it's a no-op here. (Clearing the table would make the count
        // flaky against the 2%-random prune that fires inside checkRateLimit.)
        return {};
      },
      async first<T>() {
        const key = String(args[0]);
        const next = (table.get(key) ?? 0) + 1;
        table.set(key, next);
        return { count: next } as T;
      },
    };
    return stmt;
  };
  return { prepare: () => make() };
}

describe('checkRateLimit', () => {
  const base = { ip: '1.2.3.4', salt: 's', bucket: 'react', limit: 3, windowSec: 60, now: 1000 };

  it('allows up to the limit, then rejects', async () => {
    const db = mockDB();
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) results.push((await checkRateLimit(db, base)).allowed);
    expect(results).toEqual([true, true, true, false, false]);
  });

  it('counts each bucket independently', async () => {
    const db = mockDB();
    for (let i = 0; i < 3; i++) await checkRateLimit(db, base);
    expect((await checkRateLimit(db, base)).allowed).toBe(false);
    // A different bucket for the same IP/window has its own fresh budget.
    expect((await checkRateLimit(db, { ...base, bucket: 'view' })).allowed).toBe(true);
  });

  it('resets in a new window', async () => {
    const db = mockDB();
    for (let i = 0; i < 3; i++) await checkRateLimit(db, base);
    expect((await checkRateLimit(db, base)).allowed).toBe(false);
    // Advancing past the window boundary yields a new key → fresh count.
    expect((await checkRateLimit(db, { ...base, now: base.now + 60 })).allowed).toBe(true);
  });
});
