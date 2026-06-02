import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { collectLocalePages, DIST, type RenderedPage } from '../i18n/_helpers';

/**
 * Dynamic OG cards (#148). Content detail pages without a self-hosted cover use a per-page generated
 * card at `/og/<locale>/<collection>/<slug>.png` (on our origin, so the metadata-suite origin
 * assertion holds). This guards that the cards are real PNGs and that no page references a card that
 * wasn't generated.
 */

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // \x89PNG

function ogImage(html: string): string {
  return (
    parseHTML(html).document.querySelector('meta[property="og:image"]')?.getAttribute('content') ??
    ''
  );
}

/** og:image URL → dist-relative path (or null if it's not a generated card). */
function cardDistPath(url: string): string | null {
  const m = url.match(/^https:\/\/rsicarelli\.com(\/og\/.+\.png)$/);
  return m ? m[1].slice(1) : null;
}

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
});

describe('OG cards', () => {
  it('generates PNG cards under /og/**', async () => {
    const files = (await readdir(join(DIST, 'og'), { recursive: true })).filter((f) =>
      f.toString().endsWith('.png'),
    );
    expect(files.length).toBeGreaterThan(0); // ~114 image-less content pages
  });

  it('every page that references a generated card has a real 1200×630-ish PNG on disk', async () => {
    let referenced = 0;
    for (const p of pages) {
      const rel = cardDistPath(ogImage(p.html));
      if (!rel) continue;
      referenced++;
      const buf = await readFile(join(DIST, rel));
      expect(buf.subarray(0, 4), `${p.relPath}: ${rel} is not a PNG`).toEqual(PNG_MAGIC);
      expect((await stat(join(DIST, rel))).size, `${rel} too small`).toBeGreaterThan(2000);
    }
    expect(referenced, 'no pages used a generated card').toBeGreaterThan(0);
  });

  it('image-less blog posts and talks use a generated card', () => {
    const blog = pages.find(
      (p) => p.logicalPath === '/blog/android-plataforma-parte-1-modularizacao',
    );
    const talk = pages.find((p) => p.logicalPath === '/talks/kotlinconf-2025');
    expect(cardDistPath(ogImage(blog!.html)), 'mirrored post should use a card').toBeTruthy();
    expect(cardDistPath(ogImage(talk!.html)), 'talk should use a card').toBeTruthy();
  });
});
