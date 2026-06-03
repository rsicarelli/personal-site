/**
 * Newsletter subscribe (#197) — Cloudflare Pages Function.
 *
 * `POST /api/subscribe` takes an email from our own form and creates a **Buttondown** subscriber via
 * Buttondown's API **server-side** (key = `BUTTONDOWN_API_KEY` secret). No third-party JS/cookies on
 * the site → no consent banner. Buttondown is configured for **double opt-in**, so it sends the
 * confirmation + welcome email itself; an address only joins the list after the visitor confirms.
 *
 * Anti-spam: honeypot (`website`) + double opt-in (the list can't be polluted) + same-origin guard.
 * No enumeration leak — "already subscribed" looks like success, and Buttondown errors are never
 * echoed to the client. A GET returns 405.
 */
import { isSameOrigin, utcDate, dailySalt } from '../_lib/view';
import { checkRateLimit, type RateLimitDB } from '../_lib/ratelimit';
import {
  isValidEmail,
  isHoneypotFilled,
  parseSubscribeBody,
  wantsJson,
  safeLocale,
} from '../_lib/subscribe';

interface Env {
  BUTTONDOWN_API_KEY?: string;
  /** Optional D1 binding — enables the shared per-IP rate limiter (#202) when present. */
  DB?: RateLimitDB;
  /** Server secret seeding the rate-limit salt (shared with view/react). */
  VIEW_SALT_SECRET?: string;
}
type Ctx = { request: Request; env: Env };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const BUTTONDOWN_URL = 'https://api.buttondown.com/v1/subscribers';

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context;
  const asJson = wantsJson(request);

  // Respond in the caller's preferred shape: JSON for fetch, a 303 redirect for the no-JS form.
  const ok = (locale: string) =>
    asJson
      ? json({ ok: true })
      : new Response(null, {
          status: 303,
          headers: { location: `/${safeLocale(locale)}/subscribe`, 'cache-control': 'no-store' },
        });
  const fail = (status = 400) =>
    asJson ? json({ ok: false }, status) : new Response(null, { status });

  if (!isSameOrigin(request.headers.get('Origin'), request.url)) return fail(403);

  // Per-IP rate limit (#202) — a no-op until a D1 binding is added; honeypot + double opt-in remain
  // the primary spam defense. Bounds subscription-bombing volume when the DB is bound.
  if (env.DB) {
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    const salt = await dailySalt(env.VIEW_SALT_SECRET ?? '', utcDate());
    const rl = await checkRateLimit(env.DB, {
      salt,
      ip,
      bucket: 'subscribe',
      limit: 10,
      windowSec: 60,
    });
    if (!rl.allowed) return fail(429);
  }

  let input;
  try {
    input = await parseSubscribeBody(request);
  } catch {
    return fail(400);
  }

  // Honeypot tripped → pretend success, but do nothing (don't tip off the bot).
  if (isHoneypotFilled(input.website)) return ok(input.locale);

  if (!isValidEmail(input.email)) return fail(400);
  if (!env.BUTTONDOWN_API_KEY) return fail(503);

  try {
    const res = await fetch(BUTTONDOWN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email_address: input.email }),
    });
    // 2xx = created (pending confirmation). An already-existing subscriber comes back 400 — treat it
    // as success so we never reveal whether an address is on the list (enumeration).
    if (res.ok || res.status === 400) return ok(input.locale);
    return fail(502);
  } catch {
    return fail(502);
  }
}
