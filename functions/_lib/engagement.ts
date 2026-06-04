/**
 * Engagement-instrumentation helpers (#224) — pure, runtime-free pieces of `/api/engagement` so the
 * parsing / validation / dedup-key math is unit-testable without the Cloudflare runtime (mirrors the
 * split in `_lib/view.ts` and `_lib/ratelimit.ts`).
 *
 * Two signals share the endpoint: `engaged` (visible reading seconds, summed) and `read`
 * (read-to-the-end, deduped once per visitor/day). Privacy is identical to the view counter (#200):
 * the read dedup key is a one-way SHA-256 over the daily salt + path + IP + UA, so raw IP/UA are never
 * stored and the key rotates daily.
 */
import { sha256Hex } from './view';

export type EngagementKind = 'engaged' | 'read';

/** Clamp a single engaged-time sample to a sane window — bounds an inflated/garbage beacon. */
export const MAX_ENGAGED_SECONDS = 1800; // 30 min

export function isEngagementKind(v: unknown): v is EngagementKind {
  return v === 'engaged' || v === 'read';
}

/**
 * Coerce the `seconds` field to a non-negative integer within [1, MAX_ENGAGED_SECONDS]; anything
 * malformed or below a second becomes 0 (→ the endpoint records nothing).
 */
export function clampSeconds(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(Math.floor(n), MAX_ENGAGED_SECONDS);
}

/** Parse the beacon body (throws on malformed JSON → caller returns 400). */
export async function parseEngagementBody(
  request: Request,
): Promise<{ path: string; kind: string; seconds: number }> {
  const b = (await request.json()) as Record<string, unknown>;
  return {
    path: String(b.path ?? ''),
    kind: String(b.kind ?? ''),
    seconds: clampSeconds(b.seconds),
  };
}

/**
 * Dedup key for the once-per-day read-complete signal: SHA-256(dailySalt | path | IP | UA | 'read').
 * The `'read'` suffix namespaces it away from the view counter's key for the same visitor/post/day, so
 * a read-complete and a view never collide in the shared `dedup` ledger.
 */
export function readDedupKey(salt: string, path: string, ip: string, ua: string): Promise<string> {
  return sha256Hex([salt, path, ip, ua, 'read'].join('|'));
}
