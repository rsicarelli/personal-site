import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, LOCALES, type RenderedPage } from './_helpers';
import { hreflangOf } from '@/i18n/utils';

/** The switcher is the only <a> carrying both an aria-label and a hreflang (the target locale). */
function switcherLink(html: string) {
  return parseHTML(html).document.querySelector('a[aria-label][hreflang]');
}

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
});

describe('language switcher', () => {
  it('links to the other locale while preserving the current path', () => {
    for (const p of pages) {
      const link = switcherLink(p.html);
      expect(link, p.relPath).toBeTruthy();

      const other = LOCALES.find((l) => l !== p.locale)!;
      const expected = `/${other}${p.logicalPath === '/' ? '' : p.logicalPath}`;
      expect(link!.getAttribute('href'), p.relPath).toBe(expected);
      expect(link!.getAttribute('hreflang'), p.relPath).toBe(hreflangOf(other));
    }
  });
});
