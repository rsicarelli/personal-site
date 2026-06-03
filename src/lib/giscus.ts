import type { Locale } from '@/config/site';

/**
 * Giscus configuration (#195) — GitHub Discussions comments, cookieless, per-locale.
 *
 * Pure builder, separated from the component so the gating + locale→lang logic is unit-testable.
 * Returns `null` unless ALL four identifiers are present, so the Comments component (and the whole
 * giscus client script) is emitted only when configured — exactly the env-gating posture of
 * `Analytics.astro`. Activated by the `PUBLIC_GISCUS_*` vars (see astro.config.mjs / docs/comments.md).
 */
export interface GiscusEnv {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
}

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  /** `pathname` mapping keeps `/en/…` and `/pt-br/…` as separate, language-matched threads. */
  mapping: 'pathname';
  /** Giscus UI language — `pt` for pt-BR, else `en`. */
  lang: 'en' | 'pt';
}

/** Giscus UI language code for a site locale. */
export function giscusLang(locale: Locale): 'en' | 'pt' {
  return locale === 'pt-br' ? 'pt' : 'en';
}

/**
 * Build the giscus config for a locale, or `null` when not fully configured (any id missing).
 */
export function giscusConfig(env: GiscusEnv, locale: Locale): GiscusConfig | null {
  const { repo, repoId, category, categoryId } = env;
  if (!repo || !repoId || !category || !categoryId) return null;
  return {
    repo,
    repoId,
    category,
    categoryId,
    mapping: 'pathname',
    lang: giscusLang(locale),
  };
}
