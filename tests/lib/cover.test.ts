import { describe, it, expect } from 'vitest';
import { hashSeed, mulberry32, coverInputs } from '@/lib/cover';

/**
 * Cover art core (#R2). The generated covers must be DETERMINISTIC (stable across builds) yet DISTINCT
 * per post — that's the whole contract that lets us drop the scraped dev.to thumbnails.
 */
describe('cover seed + PRNG', () => {
  it('hashSeed is deterministic and input-sensitive', () => {
    expect(hashSeed('kmp-101-fleet')).toBe(hashSeed('kmp-101-fleet'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
    expect(hashSeed('')).toBeTypeOf('number');
  });

  it('mulberry32 is reproducible and stays in [0, 1)', () => {
    const seqOf = (s: number) => {
      const r = mulberry32(s);
      return [r(), r(), r(), r()];
    };
    expect(seqOf(123)).toEqual(seqOf(123));
    expect(seqOf(123)).not.toEqual(seqOf(124));
    for (const v of seqOf(987654)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('coverInputs is stable per identity and diverges by slug/topic/series', () => {
    const base = { slug: 'post', topic: 'kmp', series: 'kmp-101', part: 1 } as const;
    expect(coverInputs(base).seed).toBe(coverInputs(base).seed);
    expect(coverInputs(base).seed).not.toBe(coverInputs({ ...base, slug: 'other' }).seed);
    expect(coverInputs(base).seed).not.toBe(coverInputs({ ...base, topic: 'android' }).seed);
    expect(coverInputs(base).seed).not.toBe(coverInputs({ ...base, series: 'kmp-102' }).seed);

    const ci = coverInputs(base);
    expect(ci.topic).toBe('kmp');
    expect(ci.series).toBe('kmp-101');
    expect(ci.part).toBe(1);
    expect(ci.rng()).toBeGreaterThanOrEqual(0);
  });
});
