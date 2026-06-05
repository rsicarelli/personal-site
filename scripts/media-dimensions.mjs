/**
 * media-dimensions.mjs — bake intrinsic image dimensions for R2-hosted blog images (#186 / #154).
 *
 * Blog markdown references images on the R2 media domain as plain absolute URLs
 * (`https://media.rsicarelli.com/<key>`). At render time the `rehype-r2-images` plugin upgrades
 * those <img>s to responsive Cloudflare `/cdn-cgi/image/` srcset markup — but it needs each image's
 * intrinsic width/height to emit `width`/`height` (zero CLS) WITHOUT a build-time network fetch.
 *
 * This script is the one author-time step that captures those dimensions: it scans blog content for
 * media-domain image URLs, downloads each ONCE here (not at build), reads its real size with `sharp`,
 * and writes the committed manifest `src/lib/media-dimensions.json` ({ "<key>": [width, height] }).
 * Re-run it whenever you add/replace R2 images in a post. Idempotent; keeps existing entries.
 *
 *   node scripts/media-dimensions.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import sharp from 'sharp';

const MEDIA_HOST = 'media.rsicarelli.com';
const MANIFEST = new URL('../src/lib/media-dimensions.json', import.meta.url);
// Escape regex metacharacters in the host (the dots are literal, not wildcards) before interpolating.
const HOST_RE = MEDIA_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const URL_RE = new RegExp(
  `https://${HOST_RE}/([^\\s)"']+\\.(?:png|jpe?g|webp|avif|gif|svg))`,
  'gi',
);

const keys = new Set();
for await (const file of glob('src/content/blog/**/*.{md,mdx}')) {
  const body = await readFile(file, 'utf8');
  for (const m of body.matchAll(URL_RE)) keys.add(m[1]);
}

let manifest = {};
try {
  manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
} catch {
  /* first run */
}

let fetched = 0;
for (const key of [...keys].sort()) {
  if (manifest[key]) continue; // already captured — idempotent
  const url = `https://${MEDIA_HOST}/${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ ${res.status} ${url}`);
    process.exitCode = 1;
    continue;
  }
  const { width, height } = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
  if (!width || !height) {
    console.error(`✗ no dimensions for ${url}`);
    process.exitCode = 1;
    continue;
  }
  manifest[key] = [width, height];
  fetched++;
  console.log(`✓ ${key} → ${width}×${height}`);
}

// Drop stale entries no longer referenced by any post, then write sorted. One `[w, h]` tuple per
// line keeps the JSON Prettier-stable, so re-running this script produces no spurious diff.
const entries = [...keys].sort().filter((k) => manifest[k]);
const body = entries
  .map((k) => `  ${JSON.stringify(k)}: [${manifest[k][0]}, ${manifest[k][1]}]`)
  .join(',\n');
await writeFile(MANIFEST, `{\n${body}\n}\n`);
console.log(`\nmanifest: ${entries.length} image(s) (${fetched} newly fetched)`);
