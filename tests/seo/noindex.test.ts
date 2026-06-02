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
  it('there are placeholders to guard', () => {
    expect(placeholders.size).toBeGreaterThan(0); // currently 45
  });

  it('exactly the placeholder pages carry robots noindex — nothing else', () => {
    for (const p of pages) {
      const key = `${p.locale} ${p.logicalPath.slice(1)}`; // `/blog/x` → `blog/x`
      const expected = placeholders.has(key);
      expect(/noindex/i.test(robots(p.html)), `${p.relPath} noindex mismatch`).toBe(expected);
    }
  });

  it('uses noindex, follow (links still followed)', () => {
    const placeholder = pages.find((p) =>
      placeholders.has(`${p.locale} ${p.logicalPath.slice(1)}`),
    );
    expect(placeholder, 'no placeholder page rendered').toBeTruthy();
    expect(robots(placeholder!.html).replace(/\s/g, '')).toBe('noindex,follow');
  });

  it('real posts, home, about and listings are indexable (no robots tag)', () => {
    for (const path of ['/', '/about', '/blog', '/blog/kotlin-multiplatform-in-production']) {
      const p = pages.find((x) => x.logicalPath === path && x.locale === 'en');
      if (p) expect(robots(p.html), `${path} should be indexable`).toBe('');
    }
  });

  it('a noindexed placeholder still keeps its canonical + hreflang (we noindex, we do not delist)', () => {
    const p = pages.find((x) => placeholders.has(`${x.locale} ${x.logicalPath.slice(1)}`))!;
    const doc = parseHTML(p.html).document;
    expect(doc.querySelector('link[rel="canonical"]')).toBeTruthy();
    expect(doc.querySelectorAll('link[rel="alternate"][hreflang]').length).toBeGreaterThanOrEqual(
      3,
    );
  });
});
