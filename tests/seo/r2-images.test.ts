import { describe, it, expect } from 'vitest';
import { readFile, glob } from 'node:fs/promises';
import {
  mediaKey,
  cfTransform,
  responsiveImage,
  DEFAULT_SIZES,
} from '../../src/lib/media-image.mjs';
import dims from '../../src/lib/media-dimensions.json';

/**
 * R2 blog image pipeline (#186). The `rehype-r2-images` plugin rewrites `media.rsicarelli.com`
 * `<img>`s to responsive Cloudflare edge-transform markup with baked dimensions. These guard the
 * pure helper and the content↔manifest invariant that keeps the build fetch-free and CLS-free.
 */
const DIMS = dims as unknown as Record<string, [number, number]>;
const MEDIA = 'https://media.rsicarelli.com';
const SAMPLE = 'blog/101/part1/en/part1-01-autocomplete-vs-chat-48b1.png';

describe('media-image helper', () => {
  it('mediaKey extracts the R2 key only for the media host', () => {
    expect(mediaKey(`${MEDIA}/${SAMPLE}`)).toBe(SAMPLE);
    expect(mediaKey('https://dev-to-uploads.s3.amazonaws.com/uploads/x.png')).toBeNull();
    expect(mediaKey('https://github.com/o/r/blob/main/x.png?raw=true')).toBeNull();
    expect(mediaKey('./local.png')).toBeNull();
  });

  it('cfTransform emits a format=auto Cloudflare URL at the requested width', () => {
    expect(cfTransform(SAMPLE, 800)).toBe(`${MEDIA}/cdn-cgi/image/width=800,format=auto/${SAMPLE}`);
  });

  it('responsiveImage caps candidate widths at the intrinsic width (never upscales)', () => {
    const img = responsiveImage(SAMPLE, [1455, 978]);
    const widths = img.srcset
      .split(', ')
      .map((c) => Number(c.trim().split(' ')[1].replace('w', '')));
    expect(Math.max(...widths)).toBeLessThanOrEqual(1455);
    expect(widths).toContain(1366);
    expect(widths).not.toContain(1920);
    expect(img.width).toBe(1455);
    expect(img.height).toBe(978);
    expect(img.sizes).toBe(DEFAULT_SIZES);
    expect(img.src).toBe(cfTransform(SAMPLE, 768)); // 768 fallback when intrinsic >= 768
  });

  it('responsiveImage degrades to a single candidate for tiny images', () => {
    const img = responsiveImage(SAMPLE, [200, 100]);
    expect(img.srcset).toBe(`${cfTransform(SAMPLE, 200)} 200w`);
    expect(img.src).toBe(cfTransform(SAMPLE, 200));
  });

  it('every srcset candidate is a format=auto transform with a width descriptor', () => {
    const img = responsiveImage(SAMPLE, [2187, 1983]);
    for (const candidate of img.srcset.split(', ')) {
      expect(candidate).toMatch(
        /^https:\/\/media\.rsicarelli\.com\/cdn-cgi\/image\/width=\d+,format=auto\/.+ \d+w$/,
      );
    }
  });
});

describe('content ↔ dimensions manifest invariant', () => {
  it('every R2 image referenced in blog content has baked positive dimensions', async () => {
    const re = /https:\/\/media\.rsicarelli\.com\/([^\s)"']+\.(?:png|jpe?g|webp|avif|gif))/gi;
    const referenced = new Set<string>();
    for await (const file of glob('src/content/blog/**/*.{md,mdx}')) {
      for (const m of (await readFile(file, 'utf8')).matchAll(re)) referenced.add(m[1]);
    }
    expect(referenced.size).toBeGreaterThan(0); // the migrated claude-code-101 part1 images
    for (const key of referenced) {
      const dim = DIMS[key];
      expect(dim, `missing dimensions for ${key} — run scripts/media-dimensions.mjs`).toBeDefined();
      expect(dim[0]).toBeGreaterThan(0);
      expect(dim[1]).toBeGreaterThan(0);
    }
  });
});
