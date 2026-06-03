import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * CSP inline-script hash guard (#77).
 *
 * A static Cloudflare Pages site can't use per-request nonces, so `public/_headers` allow-lists every
 * inline <script> the build emits by its sha256 hash. Several of those hashes come from MINIFIED
 * output (the Astro ClientRouter + island runtimes, the LiteYouTube facade, the About print button),
 * so they drift whenever Astro is upgraded or a component changes. This test rebuilds nothing — it
 * reads the real `astro build` artifact under `dist/**` (run via `task test`/`task dod`, which build
 * first, or the security-tests workflow) and asserts the set of emitted inline-script hashes is
 * EXACTLY the set allow-listed in the CSP. On a mismatch it prints the offending hash so it can be
 * pasted into `public/_headers`, which is what keeps the policy from silently breaking the live site.
 */

const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));
const HEADERS = fileURLToPath(new URL('../../public/_headers', import.meta.url));
const ANALYTICS = fileURLToPath(new URL('../../src/components/Analytics.astro', import.meta.url));
const COMMENTS = fileURLToPath(
  new URL('../../src/components/content/Comments.astro', import.meta.url),
);

/** Inline, executable <script> blocks: no `src`, and not an inert JSON/LD data block. */
const INLINE_SCRIPT =
  /<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+json|json)")[^>]*>([\s\S]*?)<\/script>/g;

const sha256 = (body: string) => createHash('sha256').update(body, 'utf8').digest('base64');

/** Every distinct inline-script hash across the built site. */
async function distInlineHashes(): Promise<Set<string>> {
  const entries = await readdir(DIST, { recursive: true });
  const hashes = new Set<string>();
  for (const entry of entries) {
    if (!entry.endsWith('.html')) continue;
    const html = await readFile(join(DIST, entry.split(sep).join('/')), 'utf8');
    for (const [, body] of html.matchAll(INLINE_SCRIPT)) {
      if (body.trim() === '') continue; // external/empty
      hashes.add(sha256(body));
    }
  }
  return hashes;
}

/**
 * The Umami tracker is injected verbatim via `is:inline set:html` and is gated on the PUBLIC_UMAMI_*
 * env vars, so it's absent from a default-env build. Its emitted bytes equal the `trackerJs` template
 * literal (no interpolation), so we hash that directly to keep the guard env-independent.
 */
async function umamiHash(): Promise<string> {
  const src = await readFile(ANALYTICS, 'utf8');
  const m = src.match(/const trackerJs = `([\s\S]*?)`;/);
  if (!m) throw new Error('Could not locate the `trackerJs` literal in Analytics.astro');
  return sha256(m[1]);
}

/**
 * The Giscus loader (#195) is env-gated the same way — absent from a default-env build — and emitted
 * verbatim via `is:inline set:html`, so we hash the `giscusLoaderJs` literal directly to keep the
 * guard env-independent.
 */
async function giscusHash(): Promise<string> {
  const src = await readFile(COMMENTS, 'utf8');
  const m = src.match(/const giscusLoaderJs = `([\s\S]*?)`;/);
  if (!m) throw new Error('Could not locate the `giscusLoaderJs` literal in Comments.astro');
  return sha256(m[1]);
}

/** The `'sha256-…'` tokens from the script-src directive of whichever CSP header is set. */
async function headerScriptHashes(): Promise<Set<string>> {
  const text = await readFile(HEADERS, 'utf8');
  const line = text.split('\n').find((l) => /^\s*Content-Security-Policy(-Report-Only)?:/i.test(l));
  if (!line) throw new Error('No Content-Security-Policy header found in public/_headers');
  const scriptSrc = line.match(/script-src([^;]*)/i);
  if (!scriptSrc) throw new Error('No script-src directive found in the CSP');
  return new Set([...scriptSrc[1].matchAll(/'sha256-([^']+)'/g)].map((m) => m[1]));
}

describe('CSP inline-script hashes', () => {
  it('allow-lists exactly the inline scripts the build emits (plus the env-gated Umami tracker)', async () => {
    const emitted = await distInlineHashes();
    emitted.add(await umamiHash());
    emitted.add(await giscusHash());
    const allowed = await headerScriptHashes();

    const missing = [...emitted].filter((h) => !allowed.has(h)).map((h) => `sha256-${h}`);
    const stale = [...allowed].filter((h) => !emitted.has(h)).map((h) => `sha256-${h}`);

    expect(
      missing,
      `Inline scripts not allow-listed in public/_headers script-src — add: ${missing.join(' ')}`,
    ).toEqual([]);
    expect(
      stale,
      `Stale hashes in public/_headers no longer emitted by the build — remove: ${stale.join(' ')}`,
    ).toEqual([]);
  });
});
