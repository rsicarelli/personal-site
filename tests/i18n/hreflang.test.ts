import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from './_helpers';
import { hreflangOf } from '@/i18n/utils';

function alternates(html: string) {
  const doc = parseHTML(html).document;
  return [...doc.querySelectorAll('link[rel="alternate"]')]
    .map((l) => ({ hreflang: l.getAttribute('hreflang')!, href: l.getAttribute('href')! }))
    .sort((a, b) => a.hreflang.localeCompare(b.hreflang));
}

function canonical(html: string): string {
  return (
    parseHTML(html).document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? ''
  );
}

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
});

describe('reciprocal hreflang', () => {
  it('every page declares exactly en, pt-BR and x-default', () => {
    for (const p of pages) {
      const langs = alternates(p.html).map((a) => a.hreflang);
      expect(langs, p.relPath).toEqual(['en', 'pt-BR', 'x-default']);
    }
  });

  it('alternate sets are reciprocal across the locale variants of a path', () => {
    const byPath = new Map<string, string[]>();
    for (const p of pages) {
      const serialized = JSON.stringify(alternates(p.html));
      if (!byPath.has(p.logicalPath)) byPath.set(p.logicalPath, []);
      byPath.get(p.logicalPath)!.push(serialized);
    }
    for (const [path, sets] of byPath) {
      if (sets.length < 2) continue;
      expect(new Set(sets).size, `${path} has non-reciprocal hreflang`).toBe(1);
    }
  });

  it('uses the uppercase pt-BR attribute with a lowercase /pt-br/ slug', () => {
    for (const p of pages) {
      const pt = alternates(p.html).find((a) => a.hreflang === 'pt-BR');
      expect(pt, p.relPath).toBeTruthy();
      expect(pt!.href, p.relPath).toContain('/pt-br');
      expect(pt!.href, p.relPath).not.toContain('/pt-BR');
    }
  });

  it('self-canonical equals the self-hreflang alternate (no trailing-slash drift)', () => {
    for (const p of pages) {
      const self = alternates(p.html).find((a) => a.hreflang === hreflangOf(p.locale));
      expect(canonical(p.html), p.relPath).toBe(self!.href);
    }
  });

  it('x-default targets the gateway on home, the default locale elsewhere', () => {
    for (const p of pages) {
      const xDefault = alternates(p.html).find((a) => a.hreflang === 'x-default')!.href;
      if (p.logicalPath === '/') {
        expect(xDefault, p.relPath).toBe('https://rsicarelli.com/');
      } else {
        expect(xDefault, p.relPath).toContain('/en');
      }
    }
  });
});
