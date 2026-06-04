/**
 * Cookieless engagement instrumentation (#224) — Cloudflare Pages Function.
 *
 * POST `/api/engagement` {"path","kind":"engaged"|"depth"|"read","seconds"?,"pct"?}. Three signals, all
 * private to the author (read straight from D1 — there is **no public read endpoint and no on-page
 * number**, like the view counter #200). A GET returns 405.
 *
 *  - kind `engaged`: adds visible-reading `seconds` to `counters(slug,'engaged_seconds')` and bumps
 *    `counters(slug,'engaged_samples')`, so `engaged_seconds / engaged_samples` is the mean engaged time
 *    per post. It's a *sample sum*, not deduped — abuse is bounded by the per-IP rate limit and the
 *    per-beacon `MAX_ENGAGED_SECONDS` clamp.
 *  - kind `depth`: a 25/50/75 scroll milestone (`pct`); deduped once per IP+UA+path/day per milestone
 *    into `counters(slug,'scroll_<pct>')`. With `read` (100%) this is the read funnel.
 *  - kind `read`: the reader reached the end-of-article sentinel; deduped once per IP+UA+path/day (like a
 *    view) into `counters(slug,'read_complete')`. `read_complete / view` is the read-through rate.
 *
 * Privacy mirrors `/api/view`: no cookies, no client storage; the read dedup is a one-way
 * `SHA-256(dailySalt + path + IP + UA + 'read')` with `dailySalt = SHA-256(VIEW_SALT_SECRET + UTC-date)`
 * — raw IP/UA never stored, salt rotates daily (no KV/cron). Reuses the existing `counters`/`dedup`/
 * `ratelimit` tables — no schema change. Protections: same-origin only · bot-UA filter · build-time
 * slug allowlist (`/engagement/slugs.json`) · per-IP rate limit · POST-only · `no-store`.
 */
import { normalizePath, isBotUA, isSameOrigin, utcDate, dailySalt } from '../_lib/view';
import { checkRateLimit, type RateLimitDB } from '../_lib/ratelimit';
import {
  isEngagementKind,
  parseEngagementBody,
  reachDedupKey,
  toDepthMilestone,
} from '../_lib/engagement';

interface D1Stmt {
  bind(...vals: unknown[]): D1Stmt;
  run(): Promise<{ meta?: { changes?: number } }>;
  first<T = unknown>(): Promise<T | null>;
}
interface D1Like {
  prepare(sql: string): D1Stmt;
}
interface Env {
  DB?: D1Like;
  /** Server secret (dashboard, NOT PUBLIC_*) — seeds the daily dedup salt; shared with /api/view. */
  VIEW_SALT_SECRET?: string;
}
type Ctx = { request: Request; env: Env };

const json = (data: unknown, cache = 'no-store', status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

// Per-isolate manifest cache (5 min) — avoids refetching the allowlist on every request (as in /api/view).
let manifest: { paths: Set<string>; at: number } | null = null;
const MANIFEST_TTL = 5 * 60 * 1000;

/** Exposed for tests to reset the per-isolate cache. */
export function _clearManifestCache() {
  manifest = null;
}

async function allowedPaths(request: Request): Promise<Set<string>> {
  if (manifest && Date.now() - manifest.at < MANIFEST_TTL) return manifest.paths;
  try {
    const res = await fetch(new URL('/engagement/slugs.json', request.url).href);
    const data = (await res.json()) as { paths?: string[] };
    manifest = { paths: new Set((data.paths ?? []).map(normalizePath)), at: Date.now() };
  } catch {
    manifest = { paths: new Set(), at: Date.now() };
  }
  return manifest.paths;
}

/** Atomic upsert: increment counters(slug, kind) by a positive integer amount. */
async function bumpCounter(db: D1Like, slug: string, kind: string, by: number): Promise<void> {
  await db
    .prepare(
      'INSERT INTO counters (slug, kind, count) VALUES (?1, ?2, ?3) ON CONFLICT(slug, kind) DO UPDATE SET count = count + ?3',
    )
    .bind(slug, kind, by)
    .run();
}

/**
 * Record a once-per-day "reach" signal (read-complete or a scroll-depth milestone): insert the dedup
 * row keyed by `tag` and, only on the first sighting that day (changes>0), bump its counter. Returns
 * whether it counted.
 */
async function recordReach(
  db: D1Like,
  opts: {
    salt: string;
    path: string;
    ip: string;
    ua: string;
    tag: string;
    counter: string;
    now: number;
  },
): Promise<boolean> {
  const { salt, path, ip, ua, tag, counter, now } = opts;
  const key = await reachDedupKey(salt, path, ip, ua, tag);
  const ins = await db
    .prepare('INSERT INTO dedup (hash, ts) VALUES (?1, ?2) ON CONFLICT(hash) DO NOTHING')
    .bind(key, now)
    .run();
  const counted = (ins.meta?.changes ?? 0) > 0;
  if (counted) await bumpCounter(db, path, counter, 1);
  return counted;
}

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context;

  // Same-origin only — reject cross-site beacons.
  if (!isSameOrigin(request.headers.get('Origin'), request.url)) {
    return json({ ok: false });
  }

  let path: string;
  let kind: string;
  let seconds: number;
  let pct: unknown;
  try {
    const body = await parseEngagementBody(request);
    path = normalizePath(body.path);
    kind = body.kind;
    seconds = body.seconds;
    pct = body.pct;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isEngagementKind(kind)) return new Response(null, { status: 400 });

  // Only record for real, published posts (allowlist) — no arbitrary-row pollution.
  const allowed = await allowedPaths(request);
  if (!allowed.has(path)) return new Response(null, { status: 204 });

  const ua = request.headers.get('user-agent') ?? '';
  if (isBotUA(ua)) return json({ ok: true, counted: false });
  if (!env.DB) return json({ ok: true, counted: false });

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const salt = await dailySalt(env.VIEW_SALT_SECRET ?? '', utcDate());

  // Per-IP rate limit — bound a scripted beacon flood before touching the counters.
  const rl = await checkRateLimit(env.DB as RateLimitDB, {
    salt,
    ip,
    bucket: 'engagement',
    limit: 60,
    windowSec: 60,
  });
  if (!rl.allowed) return json({ ok: false }, 'no-store', 429);

  const now = Math.floor(Date.now() / 1000);
  const db = env.DB;

  // Opportunistic prune (no cron): occasionally drop dedup rows older than 2 days.
  const prune = async () => {
    if (Math.random() < 0.02) {
      await db
        .prepare('DELETE FROM dedup WHERE ts < ?1')
        .bind(now - 172800)
        .run();
    }
  };

  if (kind === 'read') {
    // Read-to-the-end (100%) — deduped once per visitor/day, like a view.
    const counted = await recordReach(db, {
      salt,
      path,
      ip,
      ua,
      tag: 'read',
      counter: 'read_complete',
      now,
    });
    await prune();
    return json({ ok: true, counted });
  }

  if (kind === 'depth') {
    // A 25/50/75 scroll milestone — deduped once per visitor/day per milestone → counters.scroll_<pct>.
    const milestone = toDepthMilestone(pct);
    if (milestone === null) return new Response(null, { status: 400 });
    const counted = await recordReach(db, {
      salt,
      path,
      ip,
      ua,
      tag: `depth:${milestone}`,
      counter: `scroll_${milestone}`,
      now,
    });
    await prune();
    return json({ ok: true, counted });
  }

  // kind === 'engaged' — a sample sum (no dedup); ignore empty/junk samples.
  if (seconds < 1) return json({ ok: true, counted: false });
  await bumpCounter(env.DB, path, 'engaged_seconds', seconds);
  await bumpCounter(env.DB, path, 'engaged_samples', 1);
  return json({ ok: true, counted: true });
}
