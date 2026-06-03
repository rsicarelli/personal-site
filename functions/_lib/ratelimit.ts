/**
 * Per-IP fixed-window rate limiter (#202) — shared by every public write endpoint
 * (`/api/view`, `/api/react`, `/api/subscribe`). Separated from the endpoints so the window math and
 * key derivation are unit-testable without the Cloudflare runtime.
 *
 * Privacy: the limiter key is a one-way `SHA-256(dailySalt + IP + bucket + windowStart)` — the raw IP
 * is never stored, mirroring the `dedup` ledger (#200). The salt rotates daily (see `dailySalt`), so
 * the keys can't be precomputed or correlated across days.
 */
import { sha256Hex } from './view';

/** Minimal D1 surface the limiter needs (a prepared statement that returns a single row). */
export interface RateLimitStmt {
  bind(...vals: unknown[]): RateLimitStmt;
  run(): Promise<unknown>;
  first<T = unknown>(): Promise<T | null>;
}
export interface RateLimitDB {
  prepare(sql: string): RateLimitStmt;
}

/** Start of the fixed window containing `nowSec`, in unix seconds. */
export function windowStart(nowSec: number, windowSec: number): number {
  return Math.floor(nowSec / windowSec) * windowSec;
}

/** One-way limiter key — unique per (visitor, endpoint bucket, time window). */
export function rateLimitKey(
  salt: string,
  ip: string,
  bucket: string,
  start: number,
): Promise<string> {
  return sha256Hex([salt, ip, bucket, String(start)].join('|'));
}

export interface RateLimitOptions {
  salt: string;
  ip: string;
  /** Namespaces each endpoint's budget, e.g. 'view' | 'react' | 'subscribe'. */
  bucket: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
  /** Current time in unix seconds (injectable for tests). */
  now?: number;
}

/**
 * Record one request and report whether it's within budget. A single-statement upsert increments the
 * window's counter and returns the new total (`RETURNING count`), so the check is atomic. Occasionally
 * prunes windows older than two window-lengths (no cron). `allowed` is false once the count exceeds
 * `limit` — the caller should reject with 429.
 */
export async function checkRateLimit(
  db: RateLimitDB,
  { salt, ip, bucket, limit, windowSec, now = Math.floor(Date.now() / 1000) }: RateLimitOptions,
): Promise<{ allowed: boolean; count: number }> {
  const start = windowStart(now, windowSec);
  const key = await rateLimitKey(salt, ip, bucket, start);

  const row = await db
    .prepare(
      'INSERT INTO ratelimit (key, count, ts) VALUES (?1, 1, ?2) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count',
    )
    .bind(key, start)
    .first<{ count: number }>();
  const count = row?.count ?? 1;

  // Opportunistic prune (no cron): occasionally drop windows older than two window-lengths.
  if (Math.random() < 0.02) {
    await db
      .prepare('DELETE FROM ratelimit WHERE ts < ?1')
      .bind(start - windowSec * 2)
      .run();
  }

  return { allowed: count <= limit, count };
}
