import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile, readdir } from 'node:fs/promises';
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

describe('RSS autodiscovery', () => {
  it('every page advertises its locale feed once; series landings also advertise their series feed', async () => {
    const pages = await collectLocalePages();
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) {
      const hrefs = [
        ...parseHTML(p.html).document.querySelectorAll(
          'link[rel="alternate"][type="application/rss+xml"]',
        ),
      ].map((l) => l.getAttribute('href'));
      const localeFeed = `/${p.locale}/rss.xml`;
      // The site-wide locale feed (BaseLayout) is present on every page, exactly once.
      expect(hrefs.filter((h) => h === localeFeed).length, `${p.relPath}: locale feed once`).toBe(
        1,
      );

      // A series landing (`<locale>/series/<slug>/index.html`) additionally advertises its own
      // per-series feed (#231 B3); no other page type adds an RSS alternate.
      const seriesMatch = p.relPath.match(/^[^/]+\/series\/([^/]+)\/index\.html$/);
      const extra = hrefs.filter((h) => h !== localeFeed);
      if (seriesMatch) {
        expect(extra, `${p.relPath}: series landing advertises its feed`).toEqual([
          `/${p.locale}/series/${seriesMatch[1]}/rss.xml`,
        ]);
      } else {
        expect(extra, `${p.relPath}: only series landings add a feed`).toEqual([]);
      }
    }
  });
});

describe('per-series RSS feeds (#231 B3)', () => {
  it('each series feed is single-locale, atom-correct, and lists ≥1 post', async () => {
    let checked = 0;
    for (const locale of LOCALES) {
      const slugs = await readdir(join(DIST, locale, 'series'));
      for (const slug of slugs) {
        let xml: string;
        try {
          xml = await readFile(join(DIST, locale, 'series', slug, 'rss.xml'), 'utf8');
        } catch {
          continue; // landing dir without a feed (e.g. an empty series) — nothing to assert
        }
        checked++;
        const other = LOCALES.find((l) => l !== locale)!;
        expect(xml, `${locale}/${slug}`).toContain(`<language>${hreflangOf(locale)}</language>`);
        expect(xml, `${locale}/${slug}`).toContain(
          `<atom:link href="${ORIGIN}/${locale}/series/${slug}/rss.xml" rel="self" type="application/rss+xml"/>`,
        );
        expect(xml.match(/<item>/g)?.length ?? 0, `${locale}/${slug}`).toBeGreaterThan(0);
        expect(xml, `${locale}/${slug} leaks ${other}`).not.toContain(`${ORIGIN}/${other}/blog/`);
      }
    }
    expect(checked, 'no per-series feeds found in dist').toBeGreaterThan(0);
  });
});
