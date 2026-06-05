import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';

/**
 * Generated covers (#R2). Replacing the dev.to-scraped `coverUrl` thumbnails with on-site SVG art:
 * guard that listings render the generated covers, the series hero exposes a real accessible image,
 * and the dev.to COVER host is gone from the build. (Body images on `dev-to-uploads.s3` are a
 * separate R2 follow-up and intentionally NOT asserted here.)
 */
let pages: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
});

describe('on-site generated covers', () => {
  it('the blog hub renders generated cover svgs in its listing', () => {
    const hub = pages.find((p) => p.logicalPath === '/blog' && p.locale === 'en');
    expect(hub, 'no /blog hub page').toBeTruthy();
    const svgs = parseHTML(hub!.html).document.querySelectorAll('main svg');
    expect(svgs.length, 'hub should render cover svgs').toBeGreaterThan(0);
  });

  it('each series landing renders a generated cover banner (art svg + the title)', () => {
    const landings = pages.filter((p) => /^\/series\/[^/]+$/.test(p.logicalPath));
    expect(landings.length, 'no series landings built').toBeGreaterThan(0);
    for (const p of landings) {
      const doc = parseHTML(p.html).document;
      // The hero is now a CoverBanner: decorative art svg + a real <h1> title meshed over it.
      expect(doc.querySelector('main svg'), `${p.relPath}: series hero cover svg`).toBeTruthy();
      expect(
        doc.querySelector('main h1')?.textContent?.trim(),
        `${p.relPath}: hero title`,
      ).toBeTruthy();
    }
  });

  it('no dev.to cover host (media2.dev.to) remains in any built HTML', () => {
    for (const p of pages) {
      expect(p.html.includes('media2.dev.to'), `${p.relPath} still references media2.dev.to`).toBe(
        false,
      );
    }
  });
});
