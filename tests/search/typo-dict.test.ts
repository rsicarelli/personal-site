import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  boundedEditDistance,
  distanceBound,
  correctTerm,
  correctQuery,
  termsFromCorpus,
} from '@/lib/search/typo';
import { LOCALES } from '@/config/site';
import { DIST } from '../i18n/_helpers';

/**
 * Typo-correction core (`src/lib/search/typo.ts`) — the importable edit-distance helper the instant
 * island uses to rewrite near-miss queries before fetching. Extracted from the island so it's
 * testable headlessly. Also asserts the `/{locale}/search-terms.json` build endpoint emits a
 * non-empty, deduped, lowercase term list per locale (the dictionary the island lazy-loads).
 */

const DICT = ['kotlin', 'multiplatform', 'android', 'gradle', 'coroutines', 'swift'];

describe('boundedEditDistance', () => {
  it('computes the true distance within the bound', () => {
    expect(boundedEditDistance('kotln', 'kotlin', 2)).toBe(1);
    expect(boundedEditDistance('cat', 'cat', 1)).toBe(0);
  });

  it('early-outs past the bound (returns max+1)', () => {
    expect(boundedEditDistance('xyzzyqqq', 'kotlin', 2)).toBeGreaterThan(2);
    // A length gap larger than the bound is rejected without a full DP.
    expect(boundedEditDistance('a', 'abcdef', 1)).toBe(2);
  });
});

describe('distanceBound', () => {
  it('is 1 for short terms and 2 for ≥5-char terms', () => {
    expect(distanceBound('cat')).toBe(1);
    expect(distanceBound('kotlin')).toBe(2);
  });
});

describe('correctTerm', () => {
  it('corrects a near-miss to the closest dictionary term', () => {
    expect(correctTerm('kotln', DICT)).toBe('kotlin');
    expect(correctTerm('androd', DICT)).toBe('android');
  });

  it('never rewrites an exact dictionary hit', () => {
    expect(correctTerm('kotlin', DICT)).toBe('kotlin');
  });

  it('never rewrites a legitimate prefix (prefix search already matches it)', () => {
    expect(correctTerm('kot', DICT)).toBe('kot');
    expect(correctTerm('multi', DICT)).toBe('multi');
  });

  it('leaves nonsense unchanged (no neighbour in range)', () => {
    expect(correctTerm('xyzzyqqq', DICT)).toBe('xyzzyqqq');
  });

  it('respects the bound — a 1-char term is never corrected', () => {
    expect(correctTerm('k', DICT)).toBe('k');
  });

  it('does not correct a short term whose nearest neighbour is 2 edits away', () => {
    // `cit` → `swift` is far; `cat`-like short words stay put under the bound=1 rule.
    expect(correctTerm('zzt', DICT)).toBe('zzt');
  });
});

describe('correctQuery', () => {
  it('corrects each term and reports changed', () => {
    expect(correctQuery('kotln androd', DICT)).toEqual({
      corrected: 'kotlin android',
      changed: true,
    });
  });

  it('returns the query unchanged when nothing matches', () => {
    expect(correctQuery('kotlin swift', DICT)).toEqual({
      corrected: 'kotlin swift',
      changed: false,
    });
  });

  it('no-ops on an empty dictionary', () => {
    expect(correctQuery('kotln', [])).toEqual({ corrected: 'kotln', changed: false });
  });
});

describe('termsFromCorpus', () => {
  it('lowercases, splits, dedupes and keeps ≥3-char tokens', () => {
    const terms = termsFromCorpus([
      { title: 'Kotlin Multiplatform', tags: ['KMP', 'Kotlin'] },
      { title: 'Função pura', tags: [] },
    ]);
    expect(terms).toContain('kotlin');
    expect(terms).toContain('multiplatform');
    expect(terms).toContain('kmp');
    expect(terms).toContain('função'); // diacritics survive (Unicode-aware split)
    // Deduped: `kotlin` appears once despite two sources.
    expect(terms.filter((t) => t === 'kotlin')).toHaveLength(1);
    // Short tokens dropped.
    expect(terms.every((t) => t.length >= 3)).toBe(true);
  });
});

/**
 * The endpoint is statically prerendered (`getStaticPaths` over both locales) and reads
 * `astro:content`, a virtual module that only resolves inside an Astro build — so it can't be
 * invoked headlessly in Vitest. Assert on the BUILT `dist/{locale}/search-terms.json` artifact, the
 * same dist-rendered approach the rest of the suite uses (run via `task test`/`task dod`).
 */
describe('search-terms.json endpoint (built dist)', () => {
  for (const locale of LOCALES) {
    it(`emits a non-empty, deduped, lowercase list for ${locale}`, async () => {
      const raw = await readFile(join(DIST, locale, 'search-terms.json'), 'utf8');
      const body = JSON.parse(raw) as { terms: string[] };
      expect(Array.isArray(body.terms)).toBe(true);
      expect(body.terms.length).toBeGreaterThan(0);
      // Lowercase + deduped.
      expect(body.terms.every((t) => t === t.toLowerCase())).toBe(true);
      expect(new Set(body.terms).size).toBe(body.terms.length);
    });
  }
});
