/**
 * Placeholder-post scan (#152 → #173) — the single source of truth for "which blog pages are
 * `translated: false` placeholders". Pure node:fs, no dependencies, so it's importable from BOTH
 * the Astro config (sitemap `filter`, runs under vite-node) and the Vitest rendered-output suites.
 *
 * A `translated: false` post carries the original-language body until its translation lands (#143).
 * Those wrong-language pages get `robots: noindex, follow` (see BaseLayout) AND are dropped from the
 * sitemap (#173) so Search Console doesn't flag a benign "Submitted URL marked noindex". Keying both
 * behaviours on this one scan makes them self-maintaining: flip a file to `translated: true` and the
 * page returns to the index and the sitemap with no other edit.
 *
 * Kept byte-for-byte in step with the scan in scripts/check-locale-completeness.mjs and
 * src/lib/content.ts (same `<slug>.<en|pt>.<ext>` regex, same `/index` collapse, same suffix map).
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = fileURLToPath(new URL('../src/content/blog/', import.meta.url));

/** On-disk locale suffix (`en`|`pt`) → URL locale segment (`en`|`pt-br`). */
const SUFFIX_TO_LOCALE = { en: 'en', pt: 'pt-br' };

/** `<slug>.<en|pt>.<md|mdx>` — blog entries are markdown; slug may contain a page-bundle `/index`. */
const LOCALE_FILE = /^(?<slug>.+)\.(?<suffix>en|pt)\.(?:mdx?)$/;

/**
 * Every `translated: false` placeholder as a `{ locale, slug }` pair (logical slug: page-bundle
 * `<slug>/index` collapsed to `<slug>`). The primitive form; callers derive keys or URLs from it.
 */
export async function placeholderBlogPosts() {
  const out = [];
  for (const entry of await readdir(BLOG, { recursive: true })) {
    const rel = entry.split(/[\\/]/).join('/');
    const m = rel.match(LOCALE_FILE);
    if (!m?.groups) continue;
    const frontmatter =
      (await readFile(resolve(BLOG, entry), 'utf8')).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    if (!/^translated:\s*false\s*$/m.test(frontmatter)) continue;
    const slug = m.groups.slug.replace(/\/index$/, '');
    out.push({ locale: SUFFIX_TO_LOCALE[m.groups.suffix], slug });
  }
  return out;
}

/**
 * Placeholder pages as site-root-relative URL paths (`/en/blog/<slug>`), no trailing slash — the
 * shape the sitemap `filter` and the sitemap `<loc>` assertions compare against (both normalize the
 * trailing slash away first).
 */
export async function placeholderBlogPaths() {
  return new Set(
    (await placeholderBlogPosts()).map(({ locale, slug }) => `/${locale}/blog/${slug}`),
  );
}
