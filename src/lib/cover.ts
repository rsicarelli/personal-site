import type { Topic } from '@/lib/content';

/**
 * Deterministic cover art core (#R2 cover system). Pure, Astro-free, so it unit-tests directly and is
 * imported by `Cover.astro`. Generated covers replace the dev.to-scraped `coverUrl` thumbnails: the
 * art is seeded from a post's identity so it's stable across builds, distinct per post, and uses ONLY
 * the design tokens (one accent) — variants differentiate by geometry/seed, never by new colors.
 */

/** FNV-1a 32-bit hash of a string → an unsigned 32-bit seed. Stable across runs/platforms. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — a tiny, fast, deterministic PRNG. Returns successive values in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface CoverInput {
  /** The post's clean slug (series-landing covers pass the series slug). */
  slug: string;
  topic?: Topic;
  /** Series slug when the post belongs to one (also the series-landing seed). */
  series?: string;
  /** Part number within a series, if any. */
  part?: number;
}

export interface CoverData {
  /** Stable 32-bit seed mixing topic + series + slug, so different posts diverge. */
  seed: number;
  /** A PRNG seeded by `seed` — call repeatedly for reproducible pseudo-random values. */
  rng: () => number;
  topic?: Topic;
  series?: string;
  part?: number;
}

/** Map a post/series identity to its deterministic cover seed + PRNG (+ passthrough fields). */
export function coverInputs({ slug, topic, series, part }: CoverInput): CoverData {
  const seed = hashSeed(`${topic ?? ''}|${series ?? ''}|${slug}`);
  return { seed, rng: mulberry32(seed), topic, series, part };
}
