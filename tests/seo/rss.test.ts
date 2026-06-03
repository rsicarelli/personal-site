import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectLocalePages, DIST, LOCALES, type Locale } from '../i18n/_helpers';
import { ui } from '@/i18n/ui';
import { hreflangOf } from '@/i18n/utils';

/**
 * Per-locale RSS feeds (#198) — correctness + site-wide autodiscovery.
 */

const ORIGIN = 'https://rsicarelli.com';

describe('per-locale RSS feeds', () => {
  const feeds = {} as Record<Locale, string>;
  beforeAll(async () => {
    for (const locale of LOCALES) {
      feeds[locale] = await readFile(join(DIST, locale, 'rss.xml'), 'utf8');
    }
  });

  it('has the locale-correct channel description and <language>', () => {
    for (const locale of LOCALES) {
      const xml = feeds[locale];
      expect(xml, locale).toContain(`<language>${hreflangOf(locale)}</language>`);
      // pt-BR and en descriptions differ — assert each feed carries its own.
      expect(xml, locale).toContain(ui[locale]['site.description']);
    }
  });

  it('declares the atom namespace and a correct self-link', () => {
    for (const locale of LOCALES) {
      const xml = feeds[locale];
      expect(xml, locale).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
      expect(xml, locale).toContain(
        `<atom:link href="${ORIGIN}/${locale}/rss.xml" rel="self" type="application/rss+xml"/>`,
      );
    }
  });

  it('lists only its own locale’s posts, with absolute links', () => {
    for (const locale of LOCALES) {
      const xml = feeds[locale];
      const other = LOCALES.find((l) => l !== locale)!;
      expect(xml.match(/<item>/g)?.length ?? 0, locale).toBeGreaterThan(0);
      expect(xml, locale).toContain(`<link>${ORIGIN}/${locale}/blog/`);
      expect(xml, `${locale} leaks ${other} links`).not.toContain(`${ORIGIN}/${other}/blog/`);
    }
  });
});

describe('RSS autodiscovery is site-wide', () => {
  it('every localized page advertises exactly its own locale feed (once)', async () => {
    const pages = await collectLocalePages();
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) {
      const links = [
        ...parseHTML(p.html).document.querySelectorAll(
          'link[rel="alternate"][type="application/rss+xml"]',
        ),
      ];
      expect(links.length, `${p.relPath}: expected one RSS autodiscovery link`).toBe(1);
      expect(links[0].getAttribute('href'), p.relPath).toBe(`/${p.locale}/rss.xml`);
    }
  });
});
