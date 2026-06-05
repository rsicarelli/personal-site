import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Security-header posture (#199 audit) — pins the hardened state so it can't silently regress:
 * the CSP must be ENFORCED (not Report-Only) and free of script `unsafe-inline`, alongside the
 * standard hardening headers.
 */
const HEADERS = fileURLToPath(new URL('../../public/_headers', import.meta.url));

describe('public/_headers security posture', () => {
  let text: string;
  let csp: string;
  beforeAll(async () => {
    text = await readFile(HEADERS, 'utf8');
    // The active CSP header line (not a comment).
    csp = text.split('\n').find((l) => /^\s*Content-Security-Policy:/.test(l)) ?? '';
  });

  it('enforces the CSP (no Report-Only active header)', () => {
    expect(csp, 'expected an enforcing Content-Security-Policy header').not.toBe('');
    const reportOnly = text
      .split('\n')
      .some((l) => /^\s*Content-Security-Policy-Report-Only:/.test(l));
    expect(reportOnly, 'Report-Only should be gone once enforcing').toBe(false);
  });

  it('locks down script execution (hash/allowlist, no unsafe-inline) and core directives', () => {
    const scriptSrc = csp.match(/script-src([^;]*)/)?.[1] ?? '';
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    // `'wasm-unsafe-eval'` (Pagefind search, Option A) is permitted — it only enables WebAssembly
    // compilation, not JS `eval()`. The dangerous bare `'unsafe-eval'` token must still be absent;
    // match it with word boundaries so the `wasm-` prefixed variant doesn't trip the guard.
    expect(scriptSrc).not.toMatch(/(?<!wasm-)'unsafe-eval'/);
    for (const directive of [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp, directive).toContain(directive);
    }
  });

  it('pins the tightened img-src — first-party media only (#77 final step)', () => {
    // Tightened after #255 mirrored every blog body image to R2: only the site itself, inline
    // data URIs, YouTube thumbnails (lite-youtube facade) and the R2 media domain may serve
    // images. Re-adding a third-party host here is the regression #183 exists to prevent — the
    // dist sweep (tests/seo/image-hosts.test.ts) guards the same hosts from the content side.
    const imgSrc = csp.match(/img-src([^;]*)/)?.[1]?.trim() ?? '';
    expect(imgSrc).toBe("'self' data: https://i.ytimg.com https://media.rsicarelli.com");
  });

  it('ships the standard hardening headers', () => {
    for (const header of [
      // Pinned exactly: rsicarelli.com was submitted to the Chromium HSTS preload list (#175),
      // so `includeSubDomains; preload` is a live commitment — do not weaken or drop the token.
      'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options: nosniff',
      'X-Frame-Options: DENY',
      'Referrer-Policy:',
      'Permissions-Policy:',
    ]) {
      expect(text, header).toContain(header);
    }
  });
});
