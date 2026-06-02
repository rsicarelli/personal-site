import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { LOCALES, SITE, type Locale } from '@/config/site';
import { ui } from '@/i18n/ui';
import { hreflangOf } from '@/i18n/utils';
import { getLocalizedEntries } from '@/lib/content';

/**
 * Per-locale blog feeds (#32): `/en/rss.xml` + `/pt-br/rss.xml`. Each lists only its own locale's
 * posts (via the content spine, draft-filtered in prod), so feed readers and aggregators get a
 * single-language feed. `[locale]` is dynamic, so the endpoint needs getStaticPaths like any page.
 */
export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export async function GET(context: APIContext) {
  const locale = context.params.locale as Locale;
  const posts = await getLocalizedEntries('blog', locale);
  return rss({
    title: ui[locale]['site.title'],
    description: ui[locale]['site.description'],
    // Astro.site (config `site`) is the canonical origin; fall back to the typed env value.
    site: context.site ?? SITE.url,
    items: posts.map(({ slug, entry }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/${locale}/blog/${slug}/`,
    })),
    customData: `<language>${hreflangOf(locale)}</language>`,
  });
}
