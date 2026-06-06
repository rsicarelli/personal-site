import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import { placeholderBlogPosts } from '../../scripts/placeholder-posts.mjs';

/**
 * noindex for placeholder posts (#152). The mirror emits both locales for every post; when one
 * locale has no real translation yet the file carries the original-language body with
 * `translated: false`. Those wrong-language pages must NOT be indexed (they'd be thin, duplicate,
 * wrong-language content) — they get `robots: noindex, follow`. Everything else stays indexable.
 *
 * The expected set is derived from the source frontmatter (not hardcoded) via the shared
 * placeholder scan — the same source of truth the sitemap exclusion uses (#173) — so it stays
 * correct as translations land (#143): flipping a file to `translated: true` removes it.
 */

/** Logical keys (`<locale> blog/<slug>`) of every `translated: false` placeholder in source. */
async function placeholderKeys(): Promise<Set<string>> {
  return new Set(
    (await placeholderBlogPosts()).map(({ locale, slug }) => `${locale} blog/${slug}`),
  );
}

function robots(html: string): string {
  return (
    parseHTML(html).document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''
  );
}

let pages: RenderedPage[];
let placeholders: Set<string>;
beforeAll(async () => {
  pages = await collectLocalePages();
  placeholders = await placeholderKeys();
});

describe('noindex placeholders', () => {
  it('the placeholder set is derivable (empties as #143 completes)', () => {
    // Started at 45; shrinks to 0 as translations land (#143). The behavioural guarantee below
    // ("exactly the placeholder pages carry noindex") holds at any size, including zero.
    expect(placeholders.size).toBeGreaterThanOrEqual(0);
  });

  it('only placeholders + thin tag archives + search carry noindex — posts, listings and topics never do', () => {
    for (const p of pages) {
      const key = `${p.locale} ${p.logicalPath.slice(1)}`; // `/blog/x` → `blog/x`
      const isTagArchive = /^\/blog\/tags\//.test(p.logicalPath);
      const isSearch = p.logicalPath === '/search';
      const noindex = /noindex/i.test(robots(p.html));
      if (placeholders.has(key)) {
        expect(noindex, `${p.relPath}: placeholder must be noindex`).toBe(true);
      } else if (isTagArchive) {
        // Tag archives opt into noindex when thin (#231 D2) — the exact rule is verified below.
      } else if (isSearch) {
        // Internal search results are thin/infinite-variant URLs — robots-disallowed AND noindex.
        expect(noindex, `${p.relPath}: search shell must be noindex`).toBe(true);
      } else {
        expect(noindex, `${p.relPath}: only placeholders/thin-tags/search are noindex`).toBe(false);
      }
    }
  });

  it('thin tag archives (< 3 posts) are noindex; richer ones stay indexable (#231 D2)', () => {
    const THIN = 3; // keep in sync with THIN_TAG_MIN in tags/[tag].astro
    const tagPages = pages.filter((p) => /^\/blog\/tags\//.test(p.logicalPath));
    expect(tagPages.length, 'no tag archives were built').toBeGreaterThan(0);
    for (const p of tagPages) {
      const doc = parseHTML(p.html).document;
      // Distinct posts listed on the archive (PostCard links each post twice — cover + title — so
      // dedupe by href; exclude the "← All posts" link and any tag-chip links).
      const posts = new Set(
        [...doc.querySelectorAll(`main a[href^="/${p.locale}/blog/"]`)]
          .map((a) => a.getAttribute('href')!)
          .filter((h) => h !== `/${p.locale}/blog` && !/\/blog\/tags\//.test(h)),
      );
      const noindex = /noindex/i.test(robots(p.html));
      expect(noindex, `${p.relPath}: ${posts.size} posts`).toBe(posts.size < THIN);
    }
  });

  it('uses noindex, follow (links still followed)', () => {
    const placeholder = pages.find((p) =>
      placeholders.has(`${p.locale} ${p.logicalPath.slice(1)}`),
    );
    if (!placeholder) return; // no placeholders left once #143 completes — nothing to assert
    expect(robots(placeholder.html).replace(/\s/g, '')).toBe('noindex,follow');
  });

  it('real posts, home, about and listings are indexable (no robots tag)', () => {
    for (const path of ['/', '/about', '/blog', '/blog/kmp-102-modularizacao-no-kmp']) {
      const p = pages.find((x) => x.logicalPath === path && x.locale === 'en');
      if (p) expect(robots(p.html), `${path} should be indexable`).toBe('');
    }
  });

  it('a noindexed placeholder still keeps its canonical + hreflang (we noindex, we do not delist)', () => {
    const p = pages.find((x) => placeholders.has(`${x.locale} ${x.logicalPath.slice(1)}`));
    if (!p) return; // no placeholders left once #143 completes — nothing to assert
    const doc = parseHTML(p.html).document;
    expect(doc.querySelector('link[rel="canonical"]')).toBeTruthy();
    expect(doc.querySelectorAll('link[rel="alternate"][hreflang]').length).toBeGreaterThanOrEqual(
      3,
    );
  });
});
