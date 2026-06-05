/**
 * check-dist-image-hosts.mjs — sweep the built site for third-party image hosts (#154 / #170 / #187).
 *
 * Every `<img src>` / `srcset` resource in `dist/**` must resolve to a first-party origin: the
 * site itself (relative URLs) or an allow-listed media host. Anything else is either CSP-blocked
 * in production (the enforcing `img-src` in public/_headers) or a build-time fetch dependency on
 * a third party — both regressions the #183 migration removed.
 *
 * Run after a build:  node scripts/check-dist-image-hosts.mjs
 * Exits non-zero listing every offending page + URL. The same sweep runs in CI via
 * `tests/seo/image-hosts.test.ts`, which imports `sweepDistImageHosts`.
 */
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const ALLOWED_HOSTS = new Set([
  'media.rsicarelli.com', // R2 media (+ /cdn-cgi/image/ transforms)
  'i.ytimg.com', // YouTube thumbnails (lite-youtube facade)
]);

/**
 * Absolute image URLs from an `<img>` tag's src/srcset (relative URLs are first-party → ignored).
 * srcset is split on whitespace, not commas: URLs cannot contain spaces but ours DO contain commas
 * (`/cdn-cgi/image/width=320,format=auto/...`), so comma-splitting would shear candidates apart.
 * @param {string} tag
 * @returns {string[]}
 */
function imageUrls(tag) {
  const urls = [];
  const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
  if (src) urls.push(src);
  const srcset = tag.match(/\bsrcset="([^"]+)"/)?.[1];
  if (srcset) urls.push(...srcset.split(/\s+/).map((t) => t.replace(/,+$/, '')));
  return urls.filter((u) => /^https?:\/\//.test(u));
}

/**
 * Sweep every HTML page under `distDir` for `<img>` resources on non-allow-listed hosts.
 * @param {string} distDir
 * @returns {Promise<{pages: number, offenders: Array<{file: string, url: string}>}>}
 */
export async function sweepDistImageHosts(distDir = 'dist') {
  const offenders = [];
  let pages = 0;
  for await (const file of glob(`${distDir}/**/*.html`)) {
    pages++;
    const html = await readFile(file, 'utf8');
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      for (const url of imageUrls(tag)) {
        const host = new URL(url).host;
        if (!ALLOWED_HOSTS.has(host)) offenders.push({ file, url });
      }
    }
  }
  return { pages, offenders };
}

// CLI entry — `node scripts/check-dist-image-hosts.mjs`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pages, offenders } = await sweepDistImageHosts();
  if (offenders.length > 0) {
    console.error(`✗ ${offenders.length} third-party image reference(s) in dist/:`);
    for (const { file, url } of offenders) console.error(`  ${file}\n    ${url}`);
    process.exit(1);
  }
  console.log(
    `✓ ${pages} page(s) swept — every image resolves to: ${[...ALLOWED_HOSTS].join(', ')}`,
  );
}
