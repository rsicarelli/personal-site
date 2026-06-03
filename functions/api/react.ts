/**
 * Anonymous reactions (#201) — Cloudflare Pages Function.
 *
 * `POST /api/react` {"path":"/en/blog/<slug>","emoji":"👍"} records one anonymous reaction.
 * `GET  /api/react?path=/en/blog/<slug>` returns the public per-emoji counts (the on-page display
 * source). Counts are intentionally public here — unlike the silent view counter — but carry no PII.
 *
 * Privacy: no cookies, no client storage; a reader is deduped by a one-way hash
 * `SHA-256(dailySalt + path + IP + UA + emoji)` where `dailySalt = SHA-256(VIEW_SALT_SECRET + UTC-date)`
 * (the shared engagement salt) — raw IP/UA are never stored and the salt rotates daily.
 *
 * Protections (#202): same-origin only · slug allowlist (build-time `/engagement/slugs.json`) ·
 * emoji allowlist · bot-UA filter · per-IP rate limit · salted-hash dedup (one reaction per
 * IP+UA+path+emoji/day). No Turnstile — see docs/engagement-strategy.md.
 */
import { normalizePath, isBotUA, isSameOrigin, utcDate, dailySalt } from '../_lib/view';
import { isValidEmoji, parseReactBody, reactDedupKey, countsFromRows } from '../_lib/react';
import { checkRateLimit, type RateLimitDB } from '../_lib/ratelimit';

interface D1Stmt {
  bind(...vals: unknown[]): D1Stmt;
  run(): Promise<{ meta?: { changes?: number } }>;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
interface D1Like {
  prepare(sql: string): D1Stmt;
}
interface Env {
  DB?: D1Like;
  /** Server secret (dashboard, NOT PUBLIC_*) — seeds the daily dedup + rate-limit salts. */
  VIEW_SALT_SECRET?: string;
}
type Ctx = { request: Request; env: Env };

/** Per-IP budget for the reaction write path (a one-tap action; the dedup caps real effect anyway). */
const RATE_LIMIT = 60;
const RATE_WINDOW_SEC = 60;

const json = (data: unknown, cache = 'no-store', status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

// Per-isolate manifest cache (5 min) — avoids refetching the slug allowlist on every request.
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

/** Read the public per-emoji counts for a slug (zero-filled to the full palette). */
async function readCounts(db: D1Like, path: string): Promise<Record<string, number>> {
  const { results } = await db
    .prepare('SELECT emoji, count FROM reactions WHERE slug = ?1')
    .bind(path)
    .all<{ emoji: string; count: number }>();
  return countsFromRows(results ?? []);
}

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context;

  // Same-origin only — reject cross-site writes.
  if (!isSameOrigin(request.headers.get('Origin'), request.url)) {
    return json({ ok: false }, 'no-store', 403);
  }

  let path: string;
  let emoji: string;
  try {
    const body = await parseReactBody(request);
    path = normalizePath(body.path);
    emoji = body.emoji;
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!isValidEmoji(emoji)) return new Response(null, { status: 400 });

  // Only real, published posts (allowlist) — no arbitrary-row pollution.
  const allowed = await allowedPaths(request);
  if (!allowed.has(path)) return new Response(null, { status: 204 });

  const ua = request.headers.get('user-agent') ?? '';
  if (isBotUA(ua)) return json({ ok: true, counted: false });
  if (!env.DB) return json({ ok: true, counted: false });

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const salt = await dailySalt(env.VIEW_SALT_SECRET ?? '', utcDate());

  // Per-IP rate limit (#202) — reject floods before touching the reaction tables.
  const rl = await checkRateLimit(env.DB as RateLimitDB, {
    salt,
    ip,
    bucket: 'react',
    limit: RATE_LIMIT,
    windowSec: RATE_WINDOW_SEC,
  });
  if (!rl.allowed) return json({ ok: false }, 'no-store', 429);

  const key = await reactDedupKey(salt, path, ip, ua, emoji);
  const now = Math.floor(Date.now() / 1000);

  // Insert dedup row; only the FIRST sighting (changes>0) increments the reaction count.
  const ins = await env.DB.prepare(
    'INSERT INTO dedup (hash, ts) VALUES (?1, ?2) ON CONFLICT(hash) DO NOTHING',
  )
    .bind(key, now)
    .run();
  const counted = (ins.meta?.changes ?? 0) > 0;

  if (counted) {
    await env.DB.prepare(
      'INSERT INTO reactions (slug, emoji, count) VALUES (?1, ?2, 1) ON CONFLICT(slug, emoji) DO UPDATE SET count = count + 1',
    )
      .bind(path, emoji)
      .run();
  }

  // Opportunistic prune (no cron): occasionally drop dedup rows older than 2 days.
  if (Math.random() < 0.02) {
    await env.DB.prepare('DELETE FROM dedup WHERE ts < ?1')
      .bind(now - 172800)
      .run();
  }

  const counts = await readCounts(env.DB, path);
  return json({ ok: true, counted, counts });
}

export async function onRequestGet(context: Ctx): Promise<Response> {
  const { request, env } = context;
  const path = normalizePath(new URL(request.url).searchParams.get('path') ?? '');

  const allowed = await allowedPaths(request);
  if (!path || !allowed.has(path)) return new Response(null, { status: 204 });
  if (!env.DB) return json({ path, counts: countsFromRows([]) }, 'no-store');

  const counts = await readCounts(env.DB, path);
  // Public, edge-cacheable for ~30s — counts are non-sensitive and slightly-stale is fine.
  return json({ path, counts }, 'public, s-maxage=30, stale-while-revalidate=300');
}
