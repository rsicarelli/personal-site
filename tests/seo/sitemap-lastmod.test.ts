import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from '../i18n/_helpers';
import { blogLastmod } from '../../scripts/blog-lastmod.mjs';

/**
 * Sitemap per-post <lastmod> (#231 E1). astro.config.mjs's sitemap `serialize` stamps each blog post
 * with `updatedDate ?? pubDate` (the same scan exported by scripts/blog-lastmod.mjs), so the sitemap
 * carries a real freshness signal instead of one uniform build-time date. Guards both that the date
 * is correct AND that it actually varies across posts.
 */

/** site-root path (no trailing slash) → <lastmod> text, for every <url> in the sitemap. */
function lastmodByPath(xml: string): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!loc) continue;
    map.set(
      new URL(loc).pathname.replace(/\/$/, ''),
      m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
    );
  }
  return map;
}

let sitemap: Map<string, string | null>;
let expected: Map<string, string>;
beforeAll(async () => {
  sitemap = lastmodByPath(await readFile(join(DIST, 'sitemap-0.xml'), 'utf8'));
  expected = await blogLastmod();
});

describe('sitemap per-post lastmod (#231 E1)', () => {
  it('every indexed post carries lastmod = updatedDate ?? pubDate (date-level)', () => {
    let checked = 0;
    for (const [path, iso] of expected) {
      if (!sitemap.has(path)) continue; // translated:false placeholders are filtered out (#173)
      const got = sitemap.get(path);
      expect(got, `${path}: missing <lastmod>`).toBeTruthy();
      expect(got!.slice(0, 10), `${path}: wrong lastmod`).toBe(iso.slice(0, 10));
      checked++;
    }
    expect(checked, 'no posts checked').toBeGreaterThan(0);
  });

  it('lastmod is a real per-post signal, not one uniform build date', () => {
    const days = [...expected.keys()]
      .filter((p) => sitemap.get(p))
      .map((p) => sitemap.get(p)!.slice(0, 10));
    expect(new Set(days).size, 'all posts share one lastmod').toBeGreaterThan(1);
  });
});
