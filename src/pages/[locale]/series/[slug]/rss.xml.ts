import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { LOCALES, SITE, type Locale } from '@/config/site';
import { ui } from '@/i18n/ui';
import { hreflangOf } from '@/i18n/utils';
import { getSeriesWithCounts, getSeriesPosts, getLocalizedEntry } from '@/lib/content';

/**
 * Per-series feeds (#231 B3): `/<locale>/series/<slug>/rss.xml`. A reader who finishes one part of a
 * learning path can subscribe to just that series. Items are the series' published posts in reading
 * order (`seriesOrder`), single-locale (the content spine draft-filters in prod). Summary feed, like
 * the main per-locale feed (#198) — each item's description is the answer-first `summary` lede when
 * present, else the SEO `description`. Autodiscovery `<link>` is emitted on the series landing.
 *
 * The explicit `series/<slug>/rss.xml` segment outranks the sibling `series/[...slug].astro` rest
 * route (Astro route priority: static/named segments beat a spread), so the two never collide — the
 * landing only ever generates single-segment slugs, never `<slug>/rss.xml`.
 */
export async function getStaticPaths() {
  const paths: { params: { locale: Locale; slug: string } }[] = [];
  for (const locale of LOCALES) {
    // Only series with at least one published post get a feed (mirrors the spotlight's filter).
    for (const { slug } of await getSeriesWithCounts(locale)) {
      paths.push({ params: { locale, slug } });
    }
  }
  return paths;
}

export async function GET(context: APIContext) {
  const locale = context.params.locale as Locale;
  const slug = context.params.slug as string;
  const [seriesEntry, posts] = await Promise.all([
    getLocalizedEntry('series', locale, slug),
    getSeriesPosts(locale, slug),
  ]);
  const label = seriesEntry?.entry.data.label ?? slug;
  const site = context.site ?? SITE.url;
  const self = new URL(`/${locale}/series/${slug}/rss.xml`, site).href;
  return rss({
    title: `${label} · ${ui[locale]['site.title']}`,
    description: seriesEntry?.entry.data.description ?? label,
    site,
    items: posts.map(({ slug: postSlug, entry }) => ({
      title: entry.data.title,
      // Prefer the answer-first lede; fall back to the SEO/meta description.
      description: entry.data.summary ?? entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/${locale}/blog/${postSlug}/`,
    })),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>${hreflangOf(locale)}</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
  });
}
