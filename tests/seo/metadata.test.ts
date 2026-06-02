import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectLocalePages, DIST, type RenderedPage } from '../i18n/_helpers';
import { buildSeoMeta, canonicalUrl, ogLocaleOf } from '@/lib/seo';

/**
 * Metadata system (#51) — OpenGraph + Twitter cards, per locale.
 *
 * Two layers: pure unit tests of the `src/lib/seo.ts` builder (the data), then rendered-output
 * assertions over `dist/**` (the wiring) — proving every localized page and the neutral gateway
 * emit a coherent social card whose `og:url` is byte-identical to the canonical and whose
 * `og:locale` matches the route locale.
 */

const SITE = 'https://rsicarelli.com';

describe('seo.ts — canonicalUrl', () => {
  it('re-prefixes the target locale onto the locale-stripped logical path', () => {
    expect(canonicalUrl('/en/about', 'en', SITE)).toBe(`${SITE}/en/about`);
    expect(canonicalUrl('/en/about', 'pt-br', SITE)).toBe(`${SITE}/pt-br/about`);
    expect(canonicalUrl('/pt-br/blog/post', 'en', SITE)).toBe(`${SITE}/en/blog/post`);
  });

  it('collapses the locale home so it is `/en`, never `/en/`', () => {
    expect(canonicalUrl('/en', 'en', SITE)).toBe(`${SITE}/en`);
    expect(canonicalUrl('/', 'pt-br', SITE)).toBe(`${SITE}/pt-br`);
  });
});

describe('seo.ts — ogLocaleOf', () => {
  it('maps the URL slug to the IETF underscore form (distinct from hreflang)', () => {
    expect(ogLocaleOf('en')).toBe('en_US');
    expect(ogLocaleOf('pt-br')).toBe('pt_BR');
  });
});

describe('seo.ts — buildSeoMeta', () => {
  const base = {
    title: 'About · rsicarelli.com',
    description: 'A description.',
    canonical: `${SITE}/en/about`,
    locale: 'en' as const,
    image: `${SITE}/og-default.png`,
    siteName: 'rsicarelli.com',
  };
  const find = (tags: ReturnType<typeof buildSeoMeta>, key: string) =>
    tags.find((t) => t.property === key || t.name === key)?.content;

  it('sets og:url to the canonical verbatim (no re-derivation)', () => {
    expect(find(buildSeoMeta(base), 'og:url')).toBe(`${SITE}/en/about`);
  });

  it('derives og:title by stripping the ` · {siteName}` brand suffix', () => {
    expect(find(buildSeoMeta(base), 'og:title')).toBe('About');
    expect(find(buildSeoMeta(base), 'twitter:title')).toBe('About');
  });

  it('honours an explicit ogTitle override', () => {
    expect(find(buildSeoMeta({ ...base, ogTitle: 'Custom' }), 'og:title')).toBe('Custom');
  });

  it('emits og:locale for the page and og:locale:alternate for the other locale only', () => {
    const en = buildSeoMeta(base);
    expect(find(en, 'og:locale')).toBe('en_US');
    const alts = en.filter((t) => t.property === 'og:locale:alternate').map((t) => t.content);
    expect(alts).toEqual(['pt_BR']);

    const pt = buildSeoMeta({ ...base, locale: 'pt-br' });
    expect(find(pt, 'og:locale')).toBe('pt_BR');
    expect(pt.filter((t) => t.property === 'og:locale:alternate').map((t) => t.content)).toEqual([
      'en_US',
    ]);
  });

  it('defaults og:type to website and forwards article', () => {
    expect(find(buildSeoMeta(base), 'og:type')).toBe('website');
    expect(find(buildSeoMeta({ ...base, type: 'article' }), 'og:type')).toBe('article');
  });

  it('always emits a summary_large_image Twitter card with the same image', () => {
    const tags = buildSeoMeta(base);
    expect(find(tags, 'twitter:card')).toBe('summary_large_image');
    expect(find(tags, 'og:image')).toBe(`${SITE}/og-default.png`);
    expect(find(tags, 'twitter:image')).toBe(`${SITE}/og-default.png`);
  });

  it('omits description tags when no description is given', () => {
    const tags = buildSeoMeta({ ...base, description: undefined });
    expect(find(tags, 'og:description')).toBeUndefined();
    expect(find(tags, 'twitter:description')).toBeUndefined();
  });

  it('every tag carries exactly one of property/name (so Astro emits a clean attribute)', () => {
    for (const t of buildSeoMeta(base)) {
      expect(Boolean(t.property) !== Boolean(t.name), JSON.stringify(t)).toBe(true);
    }
  });
});

describe('rendered OG/Twitter cards over dist/**', () => {
  let pages: RenderedPage[];
  let gateway: ReturnType<typeof parseHTML>['document'];

  const meta = (doc: ReturnType<typeof parseHTML>['document'], key: string) =>
    doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content') ??
    undefined;

  beforeAll(async () => {
    pages = await collectLocalePages();
    gateway = parseHTML(await readFile(join(DIST, 'index.html'), 'utf8')).document;
  });

  it('every localized page emits the core OG + Twitter set', () => {
    for (const p of pages) {
      const doc = parseHTML(p.html).document;
      for (const key of [
        'og:title',
        'og:type',
        'og:url',
        'og:image',
        'og:locale',
        'og:site_name',
      ]) {
        expect(meta(doc, key), `${p.relPath}: missing ${key}`).toBeTruthy();
      }
      expect(meta(doc, 'twitter:card'), p.relPath).toBe('summary_large_image');
    }
  });

  it('og:url equals the page canonical', () => {
    for (const p of pages) {
      const doc = parseHTML(p.html).document;
      const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
      expect(meta(doc, 'og:url'), p.relPath).toBe(canonical);
    }
  });

  it('og:locale matches the route locale (en_US for /en/, pt_BR for /pt-br/)', () => {
    for (const p of pages) {
      const doc = parseHTML(p.html).document;
      expect(meta(doc, 'og:locale'), p.relPath).toBe(ogLocaleOf(p.locale));
    }
  });

  it('og:image is an absolute https URL', () => {
    for (const p of pages) {
      const doc = parseHTML(p.html).document;
      expect(meta(doc, 'og:image'), p.relPath).toMatch(/^https:\/\/rsicarelli\.com\//);
    }
  });

  it('the neutral gateway also advertises a website card with the default image', () => {
    expect(meta(gateway, 'og:type')).toBe('website');
    expect(meta(gateway, 'og:url')).toBe(`${SITE}/`);
    expect(meta(gateway, 'og:image')).toBe(`${SITE}/og-default.png`);
    expect(meta(gateway, 'twitter:card')).toBe('summary_large_image');
  });
});
