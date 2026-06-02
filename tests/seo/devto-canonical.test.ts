import { describe, it, expect, beforeAll } from 'vitest';
import { buildCanonicalMap } from '../../scripts/devto-canonical-writeback.mjs';

/**
 * dev.to canonical write-back (#151). Guards the pure mapping that decides which rsicarelli.com URL
 * each dev.to article should declare as canonical. The URL must byte-match the self-canonical that
 * `canonicalUrl()` in src/lib/seo.ts emits — same `/<locale>/blog/<slug>`, no trailing slash — or
 * dev.to would point at a different URL than our own `<link rel="canonical">`.
 */

interface CanonicalResult {
  map: Map<number, { url: string; slug: string; locale: string; file: string }>;
  warnings: string[];
  conflicts: Set<number>;
  skippedNoId: number;
  skippedPlaceholder: number;
}

let result: CanonicalResult;
beforeAll(async () => {
  result = (await buildCanonicalMap()) as CanonicalResult;
});

describe('buildCanonicalMap', () => {
  it('maps every mirrored dev.to article exactly once with no conflicts', () => {
    // 49 dev.to articles imported; placeholders (translated:false) and hand-authored posts excluded.
    expect(result.map.size).toBe(49);
    expect(result.conflicts.size, result.warnings.join('\n')).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  it('skips the placeholders and the hand-authored posts', () => {
    expect(result.skippedPlaceholder).toBe(45);
    expect(result.skippedNoId).toBeGreaterThan(0);
  });

  it('produces unique canonical URLs in the exact self-canonical form', () => {
    const urls = [...result.map.values()].map((v) => v.url);
    expect(new Set(urls).size, 'duplicate canonical URLs').toBe(urls.length);
    for (const url of urls) {
      // /<locale>/blog/<slug> — absolute, no trailing slash, no leftover `/index` segment.
      expect(url, url).toMatch(/^https:\/\/rsicarelli\.com\/(en|pt-br)\/blog\/[^/]+$/);
    }
  });

  it('honours a custom origin without a trailing slash', async () => {
    const r = (await buildCanonicalMap({ origin: 'https://example.test/' })) as CanonicalResult;
    for (const { url } of r.map.values()) {
      expect(url.startsWith('https://example.test/')).toBe(true);
      expect(url).not.toContain('//en'); // no double slash from a trailing-slash origin
    }
  });
});
