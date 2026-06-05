/**
 * check-dist-image-hosts.mjs — sweep the built site for third-party image hosts (#154 / #170).
 *
 * Every `<img src>` / `srcset` resource in `dist/**` must resolve to a first-party origin: the
 * site itself (relative URLs) or an allow-listed media host. Anything else is either CSP-blocked
 * in production (the enforcing `img-src` in public/_headers) or a build-time fetch dependency on
 * a third party — both regressions this migration removed.
 *
 * Run after a build:  node scripts/check-dist-image-hosts.mjs
 * Exits non-zero listing every offending page + URL. (#187 will wire this into CI.)
 */
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const ALLOWED_HOSTS = new Set([
  'media.rsicarelli.com', // R2 media (+ /cdn-cgi/image/ transforms)
  'i.ytimg.com', // YouTube thumbnails (lite-youtube facade)
]);

/** Absolute image URLs from an `<img>` tag's src/srcset (relative URLs are first-party → ignored). */
function imageUrls(tag) {
  const urls = [];
  const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
  if (src) urls.push(src);
  const srcset = tag.match(/\bsrcset="([^"]+)"/)?.[1];
  if (srcset) for (const cand of srcset.split(',')) urls.push(cand.trim().split(/\s+/)[0]);
  return urls.filter((u) => /^https?:\/\//.test(u));
}

const offenders = [];
let pages = 0;
for await (const file of glob('dist/**/*.html')) {
  pages++;
  const html = await readFile(file, 'utf8');
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    for (const url of imageUrls(tag)) {
      const host = new URL(url).host;
      if (!ALLOWED_HOSTS.has(host)) offenders.push({ file, url });
    }
  }
}

if (offenders.length > 0) {
  console.error(`✗ ${offenders.length} third-party image reference(s) in dist/:`);
  for (const { file, url } of offenders) console.error(`  ${file}\n    ${url}`);
  process.exit(1);
}
console.log(`✓ ${pages} page(s) swept — every image resolves to: ${[...ALLOWED_HOSTS].join(', ')}`);
