import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import {
  collectLocalePages,
  uniqueMarkers,
  mainText,
  LOCALES,
  type RenderedPage,
} from './_helpers';
import { ui } from '@/i18n/ui';
import { hreflangOf } from '@/i18n/utils';

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
});

describe('rendered localized pages', () => {
  it('builds the localized routes (>= 4: en/pt-br × home/about)', () => {
    expect(pages.length).toBeGreaterThanOrEqual(4);
  });

  it('<html lang> matches the route locale (en / pt-BR)', () => {
    for (const p of pages) {
      const doc = parseHTML(p.html).document;
      expect(doc.documentElement.getAttribute('lang'), p.relPath).toBe(hreflangOf(p.locale));
    }
  });

  it('renders navigation chrome in the route locale, not the other', () => {
    for (const p of pages) {
      const other = LOCALES.find((l) => l !== p.locale)!;
      // Scope to the site chrome (header + footer) where the nav renders. The content slot and head
      // metadata are excluded on purpose: mirrored blog posts may show the ORIGINAL language's prose
      // as a placeholder until translated (e.g. Portuguese body + description under /en/), so the
      // other locale's common words (e.g. "Sobre") legitimately appear there — that's not a chrome
      // leak. nav.about ("About" / "Sobre") lives in the header and differs across locales.
      const doc = parseHTML(p.html).document;
      const chrome =
        (doc.querySelector('header')?.outerHTML ?? '') +
        (doc.querySelector('footer')?.outerHTML ?? '');
      expect(chrome, p.relPath).toContain(ui[p.locale]['nav.about']);
      expect(chrome, p.relPath).not.toContain(ui[other]['nav.about']);
    }
  });

  it('footer renders the grouped IA: 3 group labels, no duplicate /search link', () => {
    for (const p of pages) {
      const doc = parseHTML(p.html).document;
      // The SITE footer is the document's last <footer> — blog posts also carry an
      // in-article <footer> (tags) earlier in the DOM.
      const footer = [...doc.querySelectorAll('footer')].at(-1);
      expect(footer, p.relPath).toBeDefined();
      const html = footer!.outerHTML;
      for (const key of [
        'footer.group.explore',
        'footer.group.personal',
        'footer.group.subscribe',
      ] as const) {
        expect(html, `${p.relPath} missing ${key}`).toContain(ui[p.locale][key]);
      }
      // Search lives in the header only — the footer link duplicated it (nav evidence review).
      const hrefs = [...footer!.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
      expect(
        hrefs.some((h) => /\/search$/.test(h)),
        `${p.relPath} footer still links to /search`,
      ).toBe(false);
    }
  });

  it('main content carries no other-locale prose (no wrong-language leak)', () => {
    const markers = uniqueMarkers(12); // long, content-bearing strings only — short labels are chrome
    for (const p of pages) {
      const main = mainText(p.html);
      const other = LOCALES.find((l) => l !== p.locale)!;
      for (const m of markers[other]) {
        expect(main, `${p.relPath} leaked an other-locale string`).not.toContain(m);
      }
    }
  });

  it('the two locale variants of each path render different content', () => {
    const byPath = new Map<string, Map<string, string>>();
    for (const p of pages) {
      if (!byPath.has(p.logicalPath)) byPath.set(p.logicalPath, new Map());
      byPath.get(p.logicalPath)!.set(p.locale, mainText(p.html));
    }
    for (const [path, byLocale] of byPath) {
      if (byLocale.size < 2) continue;
      const texts = [...byLocale.values()];
      // Identical main content across locales == the same language served twice (file mis-wired).
      expect(new Set(texts).size, `${path} renders identical content in both locales`).toBe(
        texts.length,
      );
    }
  });
});
