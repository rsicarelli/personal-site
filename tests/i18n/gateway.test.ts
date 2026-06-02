import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from './_helpers';

let html: string;
let doc: ReturnType<typeof parseHTML>['document'];
beforeAll(async () => {
  html = await readFile(join(DIST, 'index.html'), 'utf8');
  doc = parseHTML(html).document;
});

describe('neutral / gateway', () => {
  it('is a real 200 document, not a redirect stub', () => {
    // A server/meta redirect would hide both languages from no-JS crawlers — forbidden.
    expect(doc.querySelector('meta[http-equiv="refresh" i]')).toBeNull();
    expect(doc.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('exposes crawlable links to both locales', () => {
    const hrefs = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/en/');
    expect(hrefs).toContain('/pt-br/');
  });

  it('advertises reciprocal hreflang (en / pt-BR / x-default)', () => {
    const langs = [...doc.querySelectorAll('link[rel="alternate"]')]
      .map((l) => l.getAttribute('hreflang'))
      .sort();
    expect(langs).toEqual(['en', 'pt-BR', 'x-default']);
  });

  it('declares html lang=en and a self canonical to /', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://rsicarelli.com/',
    );
  });

  it('only redirects via a gated inline script (invisible to crawlers)', () => {
    expect(doc.querySelector('script')?.textContent).toContain('location.replace');
  });
});
