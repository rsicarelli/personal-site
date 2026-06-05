import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectLocalePages, DIST, LOCALES, type Locale } from '../i18n/_helpers';
import { hreflangOf } from '@/i18n/utils';
import { placeholderBlogPaths } from '../../scripts/placeholder-posts.mjs';

/**
 * hreflang CI validation (#57).
 *
 * The i18n epic's `tests/i18n/hreflang.test.ts` proves the in-page alternates are reciprocal and
 * casing is right for the localized pages it collects. This SEO-epic suite *validates* the broader
 * invariant the way an auditor would, across EVERY surface that carries hreflang — the localized
 * pages, the neutral gateway `/`, AND the XML sitemap — and is strict about ISO/RFC-5646 codes
 * (the #1 hreflang error after non-reciprocity, per Ahrefs' 374k-domain study). A malformed code
 * (`pt-br` instead of `pt-BR`, `en_US`, an unknown locale) or a dangling alternate fails CI here.
 *
 * Perf: every page is parsed with linkedom exactly ONCE in `beforeAll` (the whole-graph reciprocity
 * check would otherwise re-parse each page several times and exceed the default test timeout as the
 * site grows).
 */

/** The ONLY hreflang values this bilingual site may emit. Anything else is a malformed/ISO error. */
const VALID_HREFLANG = new Set([...LOCALES.map(hreflangOf), 'x-default']);

interface Alternate {
  hreflang: string;
  href: string;
}
interface Parsed {
  relPath: string;
  locale: Locale;
  logicalPath: string;
  canonical: string;
  alts: Alternate[];
}

function altsOf(doc: ReturnType<typeof parseHTML>['document']): Alternate[] {
  // `rel="alternate"` is also valid for RSS (`type="application/rss+xml"`); scope to hreflang links.
  return [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => ({
    hreflang: l.getAttribute('hreflang')!,
    href: l.getAttribute('href')!,
  }));
}

let parsed: Parsed[];
let gatewayAlts: Alternate[];

beforeAll(async () => {
  const pages = await collectLocalePages();
  parsed = pages.map((p) => {
    const doc = parseHTML(p.html).document;
    return {
      relPath: p.relPath,
      locale: p.locale,
      logicalPath: p.logicalPath,
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      alts: altsOf(doc),
    };
  });
  gatewayAlts = altsOf(parseHTML(await readFile(join(DIST, 'index.html'), 'utf8')).document);
});

describe('hreflang ISO/RFC-5646 code validity', () => {
  it('every in-page alternate uses a valid code (en / pt-BR / x-default) — no malformed ISO codes', () => {
    const surfaces = [
      ...parsed.map((p) => ({ id: p.relPath, alts: p.alts })),
      { id: 'index.html (gateway)', alts: gatewayAlts },
    ];
    for (const { id, alts } of surfaces) {
      for (const alt of alts) {
        expect(VALID_HREFLANG.has(alt.hreflang), `${id}: invalid hreflang "${alt.hreflang}"`).toBe(
          true,
        );
        // Region casing trap: the attribute must be `pt-BR`, never the `/pt-br/` URL slug.
        expect(alt.hreflang, `${id}: lowercase region in hreflang`).not.toBe('pt-br');
      }
    }
  });

  it('every alternate href is an absolute https URL on the canonical origin', () => {
    for (const p of parsed) {
      for (const alt of p.alts) {
        expect(alt.href, `${p.relPath}: relative hreflang href`).toMatch(
          /^https:\/\/rsicarelli\.com\//,
        );
      }
    }
  });
});

describe('hreflang reciprocity across the whole page graph', () => {
  it('every non-x-default alternate points at a page that exists and links back identically', () => {
    // Map canonical URL → its alternate set, for every localized page. Reciprocity holds iff a
    // page named as someone's alternate exists AND carries the byte-identical alternate set.
    const byCanonical = new Map<string, string>(); // canonical → JSON(sorted alternates)
    const altKey = (alts: Alternate[]) =>
      alts
        .map((a) => `${a.hreflang} ${a.href}`)
        .sort()
        .join('\n');
    for (const p of parsed) byCanonical.set(p.canonical, altKey(p.alts));
    for (const p of parsed) {
      const mine = byCanonical.get(p.canonical);
      for (const alt of p.alts) {
        if (alt.hreflang === 'x-default') continue; // x-default may target the neutral gateway
        const theirs = byCanonical.get(alt.href);
        expect(
          theirs,
          `${p.relPath}: alternate ${alt.href} has no reciprocating page`,
        ).toBeTruthy();
        expect(theirs, `${p.relPath}: non-reciprocal alternate set vs ${alt.href}`).toBe(mine);
      }
    }
  });

  it('each page advertises exactly one alternate per locale plus a single x-default', () => {
    for (const p of parsed) {
      const langs = p.alts.map((a) => a.hreflang).sort();
      expect(langs, p.relPath).toEqual([...LOCALES.map(hreflangOf), 'x-default'].sort());
    }
  });
});

describe('sitemap hreflang validity', () => {
  let sitemap: string;
  let placeholders: Set<string>;
  beforeAll(async () => {
    sitemap = await readFile(join(DIST, 'sitemap-0.xml'), 'utf8');
    placeholders = await placeholderBlogPaths(); // `/en/blog/<slug>`, excluded from the sitemap (#173)
  });

  it('every sitemap xhtml:link uses a valid hreflang code', () => {
    // The sitemap is flat, predictable XML — parse hreflang attributes directly (linkedom's HTML
    // parser would mangle the `xhtml:` namespace prefix).
    const codes = [...sitemap.matchAll(/<xhtml:link\b[^>]*\bhreflang="([^"]+)"/g)].map((m) => m[1]);
    expect(codes.length, 'sitemap emitted no hreflang alternates').toBeGreaterThan(0);
    for (const code of codes) {
      // @astrojs/sitemap omits x-default by design; the localized codes must still be valid.
      expect(VALID_HREFLANG.has(code), `sitemap: invalid hreflang "${code}"`).toBe(true);
    }
  });

  it('every localized page canonical appears as a sitemap <loc>', () => {
    const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    const norm = (u: string) => u.replace(/\/$/, '');
    for (const p of parsed) {
      // `translated: false` placeholders are noindex and intentionally absent from the sitemap
      // (#173); their canonical still resolves, just not as a <loc>. Skip them here.
      if (placeholders.has(`/${p.locale}${p.logicalPath}`)) continue;
      // The internal search shells are robots-disallowed + noindex and deliberately excluded
      // from the sitemap (astro.config.mjs filter) — same reasoning, skip them too.
      if (p.logicalPath === '/search') continue;
      const present = [...locs].some((loc) => norm(loc) === norm(p.canonical));
      expect(present, `${p.relPath}: canonical ${p.canonical} missing from sitemap`).toBe(true);
    }
  });
});
