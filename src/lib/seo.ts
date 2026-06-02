import { LOCALES, type Locale } from '@/config/site';
import { stripLocale } from '@/i18n/utils';

/**
 * SEO metadata helpers (#51) — pure, build-time, dependency-free so they run inside `.astro`
 * frontmatter and unit-test without the Astro pipeline. They own the OpenGraph / Twitter surface
 * and the one canonical-URL definition shared with the JSON-LD wiring (#52), so the two can never
 * drift apart.
 */

/**
 * og:locale needs the IETF underscore form (`pt_BR`), which is distinct from both the hreflang
 * hyphen form (`pt-BR`) and the lowercase URL slug (`pt-br`). One mapping, here, so the three
 * casings can't be confused at call sites.
 */
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', 'pt-br': 'pt_BR' };
export function ogLocaleOf(locale: Locale): string {
  return OG_LOCALE[locale];
}

/**
 * The canonical URL of a route's logical path in a given locale — the SINGLE source of truth shared
 * by BaseLayout (self-canonical + hreflang alternates) and content pages (JSON-LD `url` /
 * `mainEntityOfPage`). Behaviour is identical to BaseLayout's former inline `localeUrl`: strip any
 * leading locale segment, then re-prefix the target locale (collapsing the home path so `/en`,
 * not `/en/`). `tests/i18n/hreflang.test.ts` pins the self-canonical == self-hreflang invariant.
 */
export function canonicalUrl(
  pathname: string,
  locale: Locale,
  site: string | URL | undefined,
): string {
  const logical = stripLocale(pathname, LOCALES);
  return new URL(`/${locale}${logical === '/' ? '' : logical}`, site).href;
}

/** A head `<meta>` element: OpenGraph uses `property`, Twitter uses `name`. */
export interface MetaTag {
  property?: string;
  name?: string;
  content: string;
}

export interface SeoInput {
  /** The page `<title>` string, e.g. `About · rsicarelli.com`. */
  title: string;
  description?: string;
  /** The page's canonical URL — pass the SAME value the layout emits (= `canonicalUrl(...)`). */
  canonical: string;
  locale: Locale;
  /** Absolute OG/Twitter image URL. */
  image: string;
  /** `website` for hubs/listings, `article` for posts/talks/projects. */
  type?: 'website' | 'article';
  /** Brand used for `og:site_name` AND stripped from `title` to derive `og:title`. */
  siteName: string;
  /** Explicit social-card title; defaults to `title` minus the ` · {siteName}` suffix. */
  ogTitle?: string;
}

/** Drop a trailing ` · {siteName}` so the social card shows the bare page title, not the brand tail. */
function bareTitle(title: string, siteName: string): string {
  const suffix = ` · ${siteName}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

/**
 * The full ordered OpenGraph + Twitter-card meta set for a page. Returned as data (not markup) so
 * BaseLayout just `.map`s it and `tests/seo` can assert on the array. `og:url` is always the
 * canonical (no re-derivation); one `og:locale:alternate` is emitted per *other* locale.
 */
export function buildSeoMeta(input: SeoInput): MetaTag[] {
  const {
    title,
    description,
    canonical,
    locale,
    image,
    type = 'website',
    siteName,
    ogTitle,
  } = input;
  const cardTitle = ogTitle ?? bareTitle(title, siteName);

  const tags: MetaTag[] = [
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: cardTitle },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: image },
    { property: 'og:locale', content: ogLocaleOf(locale) },
  ];
  for (const loc of LOCALES) {
    if (loc !== locale) tags.push({ property: 'og:locale:alternate', content: ogLocaleOf(loc) });
  }
  if (description) {
    // Insert og:description right after og:title for conventional ordering.
    tags.splice(3, 0, { property: 'og:description', content: description });
  }

  tags.push(
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: cardTitle },
    { name: 'twitter:image', content: image },
  );
  if (description) tags.push({ name: 'twitter:description', content: description });

  return tags;
}
