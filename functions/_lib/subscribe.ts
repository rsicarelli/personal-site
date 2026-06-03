/**
 * Pure helpers for the newsletter subscribe endpoint (#197) — separated so validation/parsing is
 * unit-testable without the Cloudflare runtime.
 */

/** Conservative email check — the real validation is Buttondown's; this just rejects obvious junk. */
export function isValidEmail(email: string): boolean {
  if (email.length < 3 || email.length > 254) return false;
  // one @, non-empty local part, a dot in the domain, no whitespace.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Honeypot: a hidden field real users never fill. Any value → almost certainly a bot. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export interface SubscribeInput {
  email: string;
  website: string; // honeypot
  locale: string;
}

/** Parse either a JSON body (fetch enhancement) or a urlencoded form body (no-JS submit). */
export async function parseSubscribeBody(request: Request): Promise<SubscribeInput> {
  const type = request.headers.get('content-type') ?? '';
  let email: string;
  let website: string;
  let locale: string;
  if (type.includes('application/json')) {
    const b = (await request.json()) as Record<string, unknown>;
    email = String(b.email ?? '');
    website = String(b.website ?? '');
    locale = String(b.locale ?? '');
  } else {
    const form = await request.formData();
    email = String(form.get('email') ?? '');
    website = String(form.get('website') ?? '');
    locale = String(form.get('locale') ?? '');
  }
  return { email: email.trim().toLowerCase(), website, locale };
}

/** Did the caller submit via `fetch` (wants JSON back) vs a plain no-JS form (wants a redirect)? */
export function wantsJson(request: Request): boolean {
  const type = request.headers.get('content-type') ?? '';
  const accept = request.headers.get('accept') ?? '';
  return type.includes('application/json') || accept.includes('application/json');
}

/** Normalize the locale to one we route (`en` | `pt-br`), defaulting to `en`. */
export function safeLocale(locale: string): 'en' | 'pt-br' {
  return locale === 'pt-br' ? 'pt-br' : 'en';
}
