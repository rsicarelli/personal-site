/**
 * Pure helpers for the view-count endpoint (#200) — separated so the security-relevant logic is
 * unit-testable without the Cloudflare runtime. Web Crypto (`crypto.subtle`) is available both in the
 * Workers runtime and in Node/vitest.
 */

/** Normalize a request path: ensure a leading slash, drop a trailing slash (except root). */
export function normalizePath(p: string): string {
  if (!p) return '';
  let path = p.trim();
  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

/** Crawler/bot user-agents we don't count as reader views. */
const BOT_RE =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|quora link preview|bitlybot|headlesschrome|phantomjs|whatsapp|telegrambot|preview|monitor|lighthouse|pingdom|uptime/i;

export function isBotUA(ua: string): boolean {
  if (!ua) return true; // no UA → treat as non-human, don't count
  return BOT_RE.test(ua);
}

/** Same-origin guard: the request's `Origin` header must match the request's own origin. */
export function isSameOrigin(originHeader: string | null, requestUrl: string): boolean {
  if (!originHeader) return false;
  try {
    return new URL(originHeader).origin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}

/** UTC calendar day as `YYYY-MM-DD` — the rotation key for the daily salt. */
export function utcDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Lowercase hex SHA-256 of a string (Web Crypto). */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Daily, secret-derived salt — rotates automatically by UTC date, so no KV/cron is needed and the
 * hashes can't be precomputed without the secret. Returns a hex string.
 */
export function dailySalt(secret: string, date: string): Promise<string> {
  return sha256Hex(`${secret}:${date}`);
}

/**
 * Cookieless, PII-free dedup key: a one-way hash of (dailySalt, path, IP, UA). Raw IP/UA are never
 * stored — only this hash lands in the `dedup` table, and it's unrecoverable + rotates daily.
 */
export function dedupKey(salt: string, path: string, ip: string, ua: string): Promise<string> {
  return sha256Hex([salt, path, ip, ua].join('|'));
}

/** Allowlist check against the build-time slug manifest. */
export function isAllowedPath(path: string, allowed: Set<string>): boolean {
  return allowed.has(path);
}
