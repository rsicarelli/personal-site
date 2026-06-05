#!/usr/bin/env node
/**
 * IndexNow submission helper (#54).
 *
 * Pings the IndexNow API with every URL in the built sitemap so Bing (and other IndexNow
 * participants) re-crawl changed pages instantly. ChatGPT search uses Bing's index, so this is a
 * GEO lever, not just classic SEO.
 *
 * This is a POST-DEPLOY step: it needs the LIVE origin to be reachable and the key file
 * (`public/<key>.txt`) to be served at the site root. Until the Hosting epic (#60) ships a live
 * URL, run it manually after a deploy — it does nothing destructive and is safe to re-run.
 *
 *   node scripts/indexnow-submit.mjs                # uses PUBLIC_SITE_URL or the default origin
 *   SITE_URL=https://rsicarelli.com node scripts/indexnow-submit.mjs
 *   node scripts/indexnow-submit.mjs --dry-run      # print the payload, don't POST
 *
 * Pure Node (global fetch on Node >= 18) — no dependencies. Reads dist/sitemap-0.xml, so build first.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const DIST = fileURLToPath(new URL('dist/', ROOT));
const PUBLIC = fileURLToPath(new URL('public/', ROOT));

const dryRun = process.argv.includes('--dry-run');
const origin = (process.env.SITE_URL ?? process.env.PUBLIC_SITE_URL ?? 'https://rsicarelli.com')
  .trim()
  .replace(/\/$/, '');
const host = new URL(origin).host;

/** The IndexNow key is the stem of the `public/<key>.txt` verification file. */
async function readKey() {
  const files = await readdir(PUBLIC);
  const keyFile = files.find((f) => /^[a-f0-9]{8,128}\.txt$/i.test(f));
  if (!keyFile) throw new Error('No IndexNow key file (public/<key>.txt) found.');
  const key = keyFile.replace(/\.txt$/, '');
  const contents = (
    await readFile(fileURLToPath(new URL(keyFile, `file://${PUBLIC}/`)), 'utf8')
  ).trim();
  if (contents !== key)
    throw new Error(`Key file body "${contents}" must equal its name "${key}".`);
  return key;
}

/** Extract <loc> URLs from the built sitemap, keeping only exact same-host entries. */
async function readSitemapUrls() {
  const xml = await readFile(fileURLToPath(new URL('sitemap-0.xml', `file://${DIST}/`)), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // IndexNow rejects cross-host URLs anyway; filtering here makes the contract explicit.
  const sameHost = locs.filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
  if (sameHost.length !== locs.length)
    console.warn(`IndexNow: dropped ${locs.length - sameHost.length} non-${host} URL(s) from the sitemap.`);
  return sameHost;
}

const key = await readKey();
const urlList = await readSitemapUrls();
const payload = { host, key, keyLocation: `${origin}/${key}.txt`, urlList };

console.log(`IndexNow: ${urlList.length} URL(s) for ${host} (key ${key}).`);
if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});
// IndexNow returns 200 (accepted) or 202 (received, pending validation).
console.log(`IndexNow responded ${res.status} ${res.statusText}.`);
if (![200, 202].includes(res.status)) {
  console.error(await res.text());
  process.exit(1);
}
