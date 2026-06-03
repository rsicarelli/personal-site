/**
 * Cookieless view counter (#200) — Cloudflare Pages Function.
 *
 * POST `/api/view` {"path":"/en/blog/<slug>"} counts a post view. There is **no public read endpoint
 * and no on-page number** — counts are private to the author (read directly from D1, e.g. with
 * `wrangler d1 execute`), per the engagement strategy. A GET to this route returns 405.
 *
 * Privacy: no cookies, no client storage; the visitor is deduped by a one-way hash
 * `SHA-256(dailySalt + path + IP + UA)` where `dailySalt = SHA-256(VIEW_SALT_SECRET + UTC-date)` —
 * raw IP/UA are never stored and the salt rotates daily (no KV/cron needed).
 *
 * Protections (#202 subset that fits a passive beacon): same-origin only · bot-UA filter · server-side
 * **slug allowlist** (build-time `/engagement/slugs.json`) so the table can't be polluted with fake
 * posts · salted-hash dedup (one count per IP+UA+path/day) · POST-only · `no-store`.
 */
import { normalizePath, isBotUA, isSameOrigin, utcDate, dailySalt, dedupKey } from '../_lib/view';
import { checkRateLimit, type RateLimitDB } from '../_lib/ratelimit';

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
  /** Server secret (dashboard, NOT PUBLIC_*) — seeds the daily dedup salt. */
  VIEW_SALT_SECRET?: string;
}
type Ctx = { request: Request; env: Env };

const json = (data: unknown, cache = 'no-store') =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

// Per-isolate manifest cache (5 min) — avoids refetching the allowlist on every request.
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

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context;

  // Same-origin only — reject cross-site beacons.
  if (!isSameOrigin(request.headers.get('Origin'), request.url)) {
    return json({ ok: false }, 'no-store');
  }

  let path: string;
  try {
    const body = (await request.json()) as { path?: unknown };
    path = normalizePath(String(body.path ?? ''));
  } catch {
    return new Response(null, { status: 400 });
  }

  // Only count real, published posts (allowlist) — no arbitrary-row pollution.
  const allowed = await allowedPaths(request);
  if (!allowed.has(path)) return new Response(null, { status: 204 });

  const ua = request.headers.get('user-agent') ?? '';
  if (isBotUA(ua)) return json({ ok: true, counted: false });
  if (!env.DB) return json({ ok: true, counted: false });

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const salt = await dailySalt(env.VIEW_SALT_SECRET ?? '', utcDate());

  // Per-IP rate limit (#202) — bound a scripted beacon flood before touching the counters.
  const rl = await checkRateLimit(env.DB as RateLimitDB, {
    salt,
    ip,
    bucket: 'view',
    limit: 120,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 429,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const key = await dedupKey(salt, path, ip, ua);
  const now = Math.floor(Date.now() / 1000);

  // Insert dedup row; only the FIRST sighting (changes>0) increments the counter.
  const ins = await env.DB.prepare(
    'INSERT INTO dedup (hash, ts) VALUES (?1, ?2) ON CONFLICT(hash) DO NOTHING',
  )
    .bind(key, now)
    .run();
  const counted = (ins.meta?.changes ?? 0) > 0;

  if (counted) {
    await env.DB.prepare(
      "INSERT INTO counters (slug, kind, count) VALUES (?1, 'view', 1) ON CONFLICT(slug, kind) DO UPDATE SET count = count + 1",
    )
      .bind(path)
      .run();
  }

  // Opportunistic prune (no cron): occasionally drop dedup rows older than 2 days.
  if (Math.random() < 0.02) {
    await env.DB.prepare('DELETE FROM dedup WHERE ts < ?1')
      .bind(now - 172800)
      .run();
  }

  return json({ ok: true, counted });
}
