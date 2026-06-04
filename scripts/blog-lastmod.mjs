/**
 * Blog lastmod scan (#231 E1) — maps every blog page URL to its real last-modified date
 * (`updatedDate ?? pubDate`) for the sitemap `<lastmod>`. Pure node:fs, no deps, so it imports from
 * the Astro config (sitemap `serialize`, runs under vite-node) AND the Vitest suites — the same
 * pattern as scripts/placeholder-posts.mjs.
 *
 * Without this, @astrojs/sitemap stamps every URL with the build time, so `<lastmod>` carries no
 * real signal. Dates are authored date-only (`YYYY-MM-DD`); we emit them at UTC midnight to match
 * how the rest of the site formats dates (src/lib/datetime.ts), so the sitemap can't disagree with
 * the visible/`<time>`/JSON-LD dates by a day.
 *
 * Kept in step with the `<slug>.<en|pt>.<ext>` regex + `/index` collapse used across content.ts,
 * placeholder-posts.mjs and check-locale-completeness.mjs.
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = fileURLToPath(new URL('../src/content/blog/', import.meta.url));
const SUFFIX_TO_LOCALE = { en: 'en', pt: 'pt-br' };
const LOCALE_FILE = /^(?<slug>.+)\.(?<suffix>en|pt)\.(?:mdx?)$/;

const dateOf = (fm, key) =>
  fm.match(new RegExp(`^${key}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];

/**
 * Map of site-root path (`/<locale>/blog/<slug>`, no trailing slash) → ISO datetime string
 * (`updatedDate ?? pubDate` at UTC midnight) for every blog post, both locales.
 */
export async function blogLastmod() {
  const out = new Map();
  for (const entry of await readdir(BLOG, { recursive: true })) {
    const rel = entry.split(/[\\/]/).join('/');
    const m = rel.match(LOCALE_FILE);
    if (!m?.groups) continue;
    const fm =
      (await readFile(resolve(BLOG, entry), 'utf8')).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    const date = dateOf(fm, 'updatedDate') ?? dateOf(fm, 'pubDate');
    if (!date) continue;
    const slug = m.groups.slug.replace(/\/index$/, '');
    out.set(
      `/${SUFFIX_TO_LOCALE[m.groups.suffix]}/blog/${slug}`,
      new Date(`${date}T00:00:00Z`).toISOString(),
    );
  }
  return out;
}
