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
      // Check the visible markup only: JSON-LD (#52) carries machine metadata whose schema.org
      // property names (e.g. `knowsAbout`) contain the English marker "About" by spec, which is
      // not a wrong-language leak. Strip those `<script type="application/ld+json">` blocks first.
      const doc = parseHTML(p.html).document;
      doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
      const markup = doc.documentElement.outerHTML;
      // nav.about differs (About vs Sobre) and appears on every page — a strong language signal.
      expect(markup, p.relPath).toContain(ui[p.locale]['nav.about']);
      expect(markup, p.relPath).not.toContain(ui[other]['nav.about']);
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
