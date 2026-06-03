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
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    for (const directive of [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp, directive).toContain(directive);
    }
  });

  it('ships the standard hardening headers', () => {
    for (const header of [
      'Strict-Transport-Security: max-age=',
      'X-Content-Type-Options: nosniff',
      'X-Frame-Options: DENY',
      'Referrer-Policy:',
      'Permissions-Policy:',
    ]) {
      expect(text, header).toContain(header);
    }
  });
});
