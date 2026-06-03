import { describe, it, expect } from 'vitest';
import { isHttpUrl } from '@/lib/url';

/**
 * http(s)-only URL gate (#199 audit) — author URL fields render into href/src, so reject any
 * scheme that could become a stored-XSS vector if the field ever took untrusted input.
 */
describe('isHttpUrl', () => {
  it('accepts http and https (any case)', () => {
    for (const u of [
      'https://rsicarelli.com',
      'http://example.com/a?b=1#c',
      'https://media.rsicarelli.com/blog/x.png',
      'HTTPS://EXAMPLE.COM',
    ]) {
      expect(isHttpUrl(u), u).toBe(true);
    }
  });

  it('rejects dangerous or non-web schemes and non-URLs', () => {
    for (const u of [
      'javascript:alert(1)',
      'JavaScript:alert(document.cookie)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'vbscript:msgbox(1)',
      'mailto:a@b.com',
      'tel:+5511999999999',
      'ftp://example.com/f',
      'file:///etc/passwd',
      '/relative/path',
      'relative',
      '',
      'not a url',
    ]) {
      expect(isHttpUrl(u), u).toBe(false);
    }
  });
});
