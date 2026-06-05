import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sweepDistImageHosts, ALLOWED_HOSTS } from '../../scripts/check-dist-image-hosts.mjs';

/**
 * Image-host regression guard (#187) — the terminal safeguard of epic #183.
 *
 * The build must never depend on (or ship references to) a third-party image host: allow-listing
 * one in `astro.config.mjs` makes Astro FETCH every matching markdown image at build time (the
 * intermittent CI flake #183 removed), and an unlisted host in rendered HTML is blocked by the
 * enforcing CSP `img-src` (public/_headers). Reads the real `astro build` artifact under `dist/**`
 * (the seo-tests workflow and `task test`/`task dod` build first), like the CSP hash guard.
 */

const ROOT = new URL('../../', import.meta.url);

describe('dist image-host sweep (#187)', () => {
  it('every <img> src/srcset in dist/ resolves first-party or allow-listed', async () => {
    const { pages, offenders } = await sweepDistImageHosts(fileURLToPath(new URL('dist', ROOT)));
    expect(pages, 'no dist/ pages found — run `astro build` first').toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});

describe('astro.config image allow-list (#187)', () => {
  it('allow-lists no remote image hosts (every entry reintroduces build-time fetch)', async () => {
    const config = await readFile(new URL('astro.config.mjs', ROOT), 'utf8');
    // Even the first-party R2 host must NOT be allow-listed: Astro fetches every allow-listed
    // remote image at build time to optimize it — "same bug, new host" (#183). R2 images are
    // rewritten at render time by `rehype-r2-images` instead.
    const hostnames = [...config.matchAll(/hostname:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    const domainsBlock = config.match(/domains:\s*\[([^\]]*)\]/)?.[1] ?? '';
    const domains = [...domainsBlock.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    expect([...hostnames, ...domains]).toEqual([]);
  });

  it('sweep allow-list stays first-party only', () => {
    expect([...ALLOWED_HOSTS].sort()).toEqual(['i.ytimg.com', 'media.rsicarelli.com']);
  });
});
