import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isValidEmail,
  isHoneypotFilled,
  parseSubscribeBody,
  wantsJson,
  safeLocale,
} from '../../functions/_lib/subscribe';
import { onRequestPost } from '../../functions/api/subscribe';

/**
 * Newsletter subscribe (#197) — pure helpers + the endpoint's spam/privacy behavior.
 */

describe('subscribe helpers', () => {
  it('isValidEmail accepts plausible addresses, rejects junk', () => {
    for (const e of ['a@b.co', 'rodrigo.sicarelli@gmail.com', 'x+tag@sub.example.org'])
      expect(isValidEmail(e), e).toBe(true);
    for (const e of ['', 'no-at', 'a@b', 'a b@c.com', 'a@b c.com', 'a@'.padEnd(300, 'x')])
      expect(isValidEmail(e), e).toBe(false);
  });

  it('isHoneypotFilled detects any non-empty value', () => {
    expect(isHoneypotFilled('http://spam')).toBe(true);
    expect(isHoneypotFilled('')).toBe(false);
    expect(isHoneypotFilled('   ')).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
  });

  it('safeLocale only yields a routed locale', () => {
    expect(safeLocale('pt-br')).toBe('pt-br');
    expect(safeLocale('en')).toBe('en');
    expect(safeLocale('xx')).toBe('en');
  });

  it('parseSubscribeBody handles JSON and form bodies, normalizing the email', async () => {
    const json = new Request('https://x/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: '  A@B.CO ', website: 'w', locale: 'pt-br' }),
    });
    expect(await parseSubscribeBody(json)).toEqual({
      email: 'a@b.co',
      website: 'w',
      locale: 'pt-br',
    });

    const form = new Request('https://x/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'Z@Y.io', website: '', locale: 'en' }).toString(),
    });
    expect(await parseSubscribeBody(form)).toEqual({ email: 'z@y.io', website: '', locale: 'en' });
  });

  it('wantsJson reflects the content-type / accept', () => {
    const j = new Request('https://x', { headers: { 'content-type': 'application/json' } });
    const f = new Request('https://x', {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    expect(wantsJson(j)).toBe(true);
    expect(wantsJson(f)).toBe(false);
  });
});

// --- endpoint behavior ---

const ORIGIN = 'https://rsicarelli.com';
const jsonReq = (body: Record<string, unknown>, origin: string | null = ORIGIN) =>
  new Request(`${ORIGIN}/api/subscribe`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });

describe('POST /api/subscribe', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const env = { BUTTONDOWN_API_KEY: 'secret-key' };

  it('rejects a cross-origin submit and never calls the provider', async () => {
    const res = await onRequestPost({
      request: jsonReq({ email: 'a@b.co' }, 'https://evil.example'),
      env,
    });
    expect((await res.json()).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('honeypot → fake success, no provider call', async () => {
    const res = await onRequestPost({
      request: jsonReq({ email: 'a@b.co', website: 'http://bot' }),
      env,
    });
    expect((await res.json()).ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid email with no provider call', async () => {
    const res = await onRequestPost({ request: jsonReq({ email: 'nope' }), env });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls Buttondown with the token + email on a valid submit', async () => {
    const res = await onRequestPost({ request: jsonReq({ email: 'reader@x.io' }), env });
    expect((await res.json()).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('buttondown.com/v1/subscribers');
    expect((init.headers as Record<string, string>).Authorization).toBe('Token secret-key');
    expect(JSON.parse(init.body as string)).toEqual({ email_address: 'reader@x.io' });
  });

  it('treats "already subscribed" (400) as success — no enumeration', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"detail":"already exists"}', { status: 400 }));
    const res = await onRequestPost({ request: jsonReq({ email: 'dup@x.io' }), env });
    expect((await res.json()).ok).toBe(true);
  });

  it('maps a provider failure to a generic 502 (no body leak)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('internal', { status: 500 }));
    const res = await onRequestPost({ request: jsonReq({ email: 'x@y.io' }), env });
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain('internal');
  });

  it('503 when the API key is not configured', async () => {
    const res = await onRequestPost({ request: jsonReq({ email: 'x@y.io' }), env: {} });
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no-JS form post → 303 redirect to the locale subscribe page', async () => {
    const req = new Request(`${ORIGIN}/api/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: ORIGIN },
      body: new URLSearchParams({ email: 'a@b.co', website: '', locale: 'pt-br' }).toString(),
    });
    const res = await onRequestPost({ request: req, env });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/pt-br/subscribe');
  });
});
