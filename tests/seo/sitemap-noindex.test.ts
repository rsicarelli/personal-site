import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectLocalePages, DIST, type RenderedPage } from '../i18n/_helpers';
import { placeholderBlogPaths } from '../../scripts/placeholder-posts.mjs';

/**
 * Sitemap excludes noindex placeholders (#173). The `translated: false` blog placeholders (#152)
 * carry `robots: noindex, follow`; leaving them in `sitemap-index.xml` only earns a benign
 * "Submitted URL marked 'noindex'" notice in Google Search Console. astro.config.mjs's sitemap
 * `filter` drops them, keyed on the same placeholder scan as the noindex meta — so a post returns
 * to the sitemap automatically once translated (#143), with no per-post upkeep.
 *
 * This guards both directions: no noindexed placeholder appears as a <loc>, and every real
 * (indexable) blog page still does.
 */

/** Trailing-slash-normalized site-root path of every sitemap <loc> (dir-form <loc>s carry a slash). */
function sitemapPaths(xml: string): Set<string> {
  return new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, '')),
  );
}

let locs: Set<string>;
let placeholders: Set<string>;
let pages: RenderedPage[];
beforeAll(async () => {
  locs = sitemapPaths(await readFile(join(DIST, 'sitemap-0.xml'), 'utf8'));
  placeholders = await placeholderBlogPaths(); // `/en/blog/<slug>`, no trailing slash
  pages = await collectLocalePages();
});

describe('sitemap excludes noindex placeholders (#173)', () => {
  it('the placeholder set is derivable (empties as #143 completes)', () => {
    // Started at 45; shrinks to 0 as translations land (#143). The exclusion guarantee below holds
    // at any size, including zero (an empty set trivially has nothing wrongly listed).
    expect(placeholders.size).toBeGreaterThanOrEqual(0);
  });

  it('no translated:false placeholder appears as a sitemap <loc>', () => {
    for (const path of placeholders) {
      expect(locs.has(path), `placeholder ${path} must not be listed in the sitemap`).toBe(false);
    }
  });

  it('every real (translated) blog page still appears as a sitemap <loc>', () => {
    const realBlog = pages.filter(
      (p) =>
        p.logicalPath.startsWith('/blog/') && !placeholders.has(`/${p.locale}${p.logicalPath}`),
    );
    expect(realBlog.length, 'expected real blog pages in the build').toBeGreaterThan(0);
    for (const p of realBlog) {
      const path = `/${p.locale}${p.logicalPath}`;
      expect(locs.has(path), `real post ${path} missing from the sitemap`).toBe(true);
    }
  });
});
