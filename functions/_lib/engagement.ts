/**
 * Engagement-instrumentation helpers (#224) — pure, runtime-free pieces of `/api/engagement` so the
 * parsing / validation / dedup-key math is unit-testable without the Cloudflare runtime (mirrors the
 * split in `_lib/view.ts` and `_lib/ratelimit.ts`).
 *
 * Three signals share the endpoint: `engaged` (visible reading seconds, summed), `depth` (a 25/50/75
 * scroll milestone) and `read` (read-to-the-end / 100%). `depth` + `read` are deduped once per
 * visitor/day. Privacy is identical to the view counter (#200): the dedup keys are one-way SHA-256 over
 * the daily salt + path + IP + UA (+ signal), so raw IP/UA are never stored and the key rotates daily.
 */
import { sha256Hex } from './view';

export type EngagementKind = 'engaged' | 'depth' | 'read';

/** Clamp a single engaged-time sample to a sane window — bounds an inflated/garbage beacon. */
export const MAX_ENGAGED_SECONDS = 1800; // 30 min

/** The allowed intermediate scroll-depth milestones (100% is the separate `read` signal). */
export const DEPTH_MILESTONES = [25, 50, 75] as const;
export type DepthMilestone = (typeof DEPTH_MILESTONES)[number];

export function isEngagementKind(v: unknown): v is EngagementKind {
  return v === 'engaged' || v === 'depth' || v === 'read';
}

/** Narrow a `pct` value to one of the fixed milestones (25/50/75); anything else → null (→ 400). */
export function toDepthMilestone(v: unknown): DepthMilestone | null {
  const n = typeof v === 'number' ? v : Number(v);
  return (DEPTH_MILESTONES as readonly number[]).includes(n) ? (n as DepthMilestone) : null;
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
): Promise<{ path: string; kind: string; seconds: number; pct: unknown }> {
  const b = (await request.json()) as Record<string, unknown>;
  return {
    path: String(b.path ?? ''),
    kind: String(b.kind ?? ''),
    seconds: clampSeconds(b.seconds),
    pct: b.pct,
  };
}

/**
 * Dedup key for the once-per-day signals: SHA-256(dailySalt | path | IP | UA | tag). The `tag`
 * (`'read'` or e.g. `'depth:50'`) namespaces each signal away from the view counter's key — and from
 * each other — for the same visitor/post/day, so they never collide in the shared `dedup` ledger.
 */
export function reachDedupKey(
  salt: string,
  path: string,
  ip: string,
  ua: string,
  tag: string,
): Promise<string> {
  return sha256Hex([salt, path, ip, ua, tag].join('|'));
}
