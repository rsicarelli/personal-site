import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadDocument, DIST, LOCALES, type Locale } from '../i18n/_helpers';

/**
 * Search shell — the Option D hybrid contract on the BUILT `dist/**` search page:
 *  1. The instant island is wired as a hashed `/_astro/*` ES module (progressive enhancement is
 *     shipped, under `script-src 'self'` — no inline hash, asserted by csp-hashes.test.ts).
 *  2. The no-JS baseline SURVIVES: a real `<form method="get" action="/{locale}/search">` and real
 *     filter `<a href>`s still point at the function's HTML path, so search works with JS off.
 *  3. The shell carries the data-* hooks the island reads (locale + the localized templates,
 *     including the new `data-showing-for`).
 */

type Doc = Awaited<ReturnType<typeof loadDocument>>;

describe('search shell (Option D hybrid)', () => {
  const docs: Partial<Record<Locale, Doc>> = {};
  const htmls: Partial<Record<Locale, string>> = {};

  beforeAll(async () => {
    for (const locale of LOCALES) {
      const rel = `${locale}/search/index.html`;
      docs[locale] = await loadDocument(rel);
      htmls[locale] = await readFile(join(DIST, rel), 'utf8');
    }
  });

  for (const locale of LOCALES) {
    it(`${locale}: wires the island as a hashed /_astro/*.js module`, () => {
      const html = htmls[locale]!;
      const moduleSrcs = [...html.matchAll(/<script[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g)].map(
        (m) => m[1],
      );
      const astroChunks = moduleSrcs.filter((s) => /^\/_astro\/.*\.js$/.test(s));
      expect(astroChunks.length, 'no hashed /_astro/* module on the search page').toBeGreaterThan(
        0,
      );
    });

    it(`${locale}: keeps the no-JS form (method=get action=/${locale}/search)`, () => {
      const doc = docs[locale]!;
      const form = doc.querySelector('#search-form');
      expect(form, 'no-JS search form missing').toBeTruthy();
      expect(form!.getAttribute('method')?.toLowerCase()).toBe('get');
      expect(form!.getAttribute('action')).toBe(`/${locale}/search`);
      const input = form!.querySelector('#search-q');
      expect(input?.getAttribute('name')).toBe('q');
    });

    it(`${locale}: ships real filter <a href> links to the search path`, () => {
      const doc = docs[locale]!;
      const links = [...doc.querySelectorAll('#search-filters a[data-type]')];
      expect(links.length).toBe(5); // all + 4 facets
      for (const a of links) {
        const href = a.getAttribute('href') ?? '';
        expect(href.startsWith(`/${locale}/search`), `${href} must hit the search path`).toBe(true);
      }
      // The faceted pills carry a real ?type= so they work with JS off.
      const typed = links
        .map((a) => a.getAttribute('href') ?? '')
        .filter((h) => h.includes('type='));
      expect(typed.length).toBe(4);
    });

    it(`${locale}: exposes the data-* hooks the island reads (incl. data-showing-for)`, () => {
      const doc = docs[locale]!;
      const root = doc.querySelector('#search');
      expect(root).toBeTruthy();
      for (const attr of [
        'data-locale',
        'data-count',
        'data-count-one',
        'data-empty',
        'data-error',
        'data-loading',
        'data-showing-for',
      ]) {
        expect(root!.getAttribute(attr), `#search missing ${attr}`).toBeTruthy();
      }
      expect(root!.getAttribute('data-locale')).toBe(locale);
    });
  }
});
