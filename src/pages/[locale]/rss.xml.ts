import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { LOCALES, SITE, type Locale } from '@/config/site';
import { ui } from '@/i18n/ui';
import { hreflangOf } from '@/i18n/utils';
import { getLocalizedEntries } from '@/lib/content';

/**
 * Per-locale blog feeds (#32/#198): `/en/rss.xml` + `/pt-br/rss.xml`. Each lists only its own
 * locale's posts (via the content spine, draft-filtered in prod), so feed readers and aggregators
 * get a single-language feed. `[locale]` is dynamic, so the endpoint needs getStaticPaths like any
 * page. Autodiscovery `<link rel="alternate">` is emitted site-wide from BaseLayout (RssLinks).
 *
 * Feed shape decision (#198): **summary feeds**, not full-content. Each item's description is the
 * answer-first `summary` lede when present (falling back to the SEO `description`) — a strong teaser
 * that drives the click to the canonical page. Full-content is intentionally deferred: the bodies are
 * MDX with custom components + R2 images (extra rendering/sanitizing surface), and these posts are
 * also syndicated to dev.to (canonical here), so a full-text feed widens the scraping/duplication
 * surface for little reader gain. Revisit if readers ask for full-text.
 */
export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export async function GET(context: APIContext) {
  const locale = context.params.locale as Locale;
  const posts = await getLocalizedEntries('blog', locale);
  // Astro.site (config `site`) is the canonical origin; fall back to the typed env value.
  const site = context.site ?? SITE.url;
  // Absolute self URL for the Atom self-link (feed-validator correctness).
  const self = new URL(`/${locale}/rss.xml`, site).href;
  return rss({
    title: ui[locale]['site.title'],
    description: ui[locale]['site.description'],
    site,
    // Browser-only nicety: humans clicking the feed link get the pretty-feed page (src/pages/feed.xsl.ts).
    stylesheet: '/feed.xsl',
    items: posts.map(({ slug, entry }) => ({
      title: entry.data.title,
      // Prefer the answer-first lede; fall back to the SEO/meta description.
      description: entry.data.summary ?? entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/${locale}/blog/${slug}/`,
    })),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    // RSS 2.0 channel `<copyright>` — content is CC BY-NC 4.0 (attribution required, non-commercial).
    customData: `<language>${hreflangOf(locale)}</language><copyright>© ${new Date().getFullYear()} ${SITE.name} — CC BY-NC 4.0 (${SITE.contentLicense})</copyright><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
  });
}
