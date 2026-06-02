import { ui, type UIKey } from './ui';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/config/site';

/**
 * i18n helpers shared across layouts, pages and components. Kept tiny and dependency-free so
 * they run at build time inside `.astro` frontmatter without pulling in any client JS.
 */

/**
 * Curried translator: `const t = useTranslations(locale); t('nav.blog')`. Falls back to the
 * default locale for resilience, though the typed dictionary already prevents missing keys.
 */
export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui[DEFAULT_LOCALE][key];
  };
}

/**
 * URL locale slug → content-file suffix. Routing uses `pt-br` (lowercase, SEO-friendly slug)
 * but content files are named `<slug>.pt.mdx` (documented convention, CLAUDE.md + research §04).
 * This is the single home for that mapping — content routes import it instead of re-encoding it.
 */
const CONTENT_SUFFIX: Record<Locale, string> = { en: 'en', 'pt-br': 'pt' };
export function contentSuffix(locale: Locale): string {
  return CONTENT_SUFFIX[locale];
}

/** The hreflang attribute value for a locale (lowercase URL slug → RFC-5646 region casing). */
const HREFLANG: Record<Locale, string> = { en: 'en', 'pt-br': 'pt-BR' };
export function hreflangOf(locale: Locale): string {
  return HREFLANG[locale];
}

/**
 * Strip a leading locale segment from a pathname, returning the locale-agnostic logical path
 * (always leading-slash form, e.g. `/blog/post` or `/`). Shared by the language switcher (#22)
 * and the hreflang/canonical builder (#23) so both agree on how a path maps across locales.
 */
export function stripLocale(pathname: string, locales: readonly string[] = LOCALES): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) segments.shift();
  return '/' + segments.join('/');
}
