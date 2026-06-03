import { describe, it, expect, beforeAll } from 'vitest';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import { giscusConfig, giscusLang } from '@/lib/giscus';

/**
 * Giscus comments (#195) — env-gated, per-locale.
 *
 * Unit-tests the pure config/gating logic, plus a privacy assertion that the default-env build
 * (no PUBLIC_GISCUS_*, as in CI) ships NO giscus client anywhere — comments load only once configured.
 */

describe('giscusConfig() gating + locale mapping', () => {
  const full = {
    repo: 'rsicarelli/personal-site',
    repoId: 'R_abc',
    category: 'Comments',
    categoryId: 'DIC_xyz',
  };

  it('returns null unless all four identifiers are present', () => {
    expect(giscusConfig({}, 'en')).toBeNull();
    expect(giscusConfig({ repo: full.repo }, 'en')).toBeNull();
    expect(giscusConfig({ ...full, categoryId: undefined }, 'en')).toBeNull();
    expect(giscusConfig({ ...full, repoId: '' }, 'en')).toBeNull();
  });

  it('builds a pathname-mapped config and passes the ids through when complete', () => {
    const cfg = giscusConfig(full, 'en');
    expect(cfg).not.toBeNull();
    expect(cfg).toMatchObject({
      repo: full.repo,
      repoId: full.repoId,
      category: full.category,
      categoryId: full.categoryId,
      mapping: 'pathname',
      lang: 'en',
    });
  });

  it('maps the giscus UI language per locale (pt-br → pt, else en)', () => {
    expect(giscusLang('pt-br')).toBe('pt');
    expect(giscusLang('en')).toBe('en');
    expect(giscusConfig(full, 'pt-br')!.lang).toBe('pt');
  });
});

describe('Comments are off until configured (default build)', () => {
  let pages: RenderedPage[];
  beforeAll(async () => {
    pages = await collectLocalePages();
  });

  it('ships no giscus client anywhere when PUBLIC_GISCUS_* are unset', () => {
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) {
      expect(p.html, `${p.relPath} unexpectedly embeds giscus`).not.toContain('giscus');
    }
  });
});
