import { ui } from '@/i18n/ui';

/**
 * Pretty-feed XSL (#32/#198 follow-up): a browser that opens any of the feed URLs renders this
 * stylesheet instead of raw XML ("This XML file does not appear to have any style information…"),
 * showing a human-friendly "this is a feed — paste it into your reader" page with the channel's
 * recent items. Feed readers ignore the `<?xml-stylesheet?>` PI entirely, so the feeds themselves
 * are untouched. Wired via `stylesheet: '/feed.xsl'` in both rss.xml routes.
 *
 * One stylesheet serves every feed (both locales, main + per-series): the labels for BOTH locales
 * come from the i18n dictionary at build time, and the transform picks the set matching the feed's
 * own `<language>` element — so the page stays bilingual without a per-locale stylesheet.
 *
 * CSP: zero scripts; the inline `<style>` is covered by `style-src 'unsafe-inline'` and the
 * stylesheet itself is same-origin (`style-src 'self'`) — no `public/_headers` change needed.
 * The palette is self-contained (the transformed page can't reach the site's hashed CSS bundle),
 * loosely echoing the site's editorial light/dark look.
 */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const en = ui.en;
const pt = ui['pt-br'];

// The standard RSS glyph — same path as the visible subscribe links.
const RSS_PATH =
  'M6.18 17.82a2.18 2.18 0 1 1-4.36 0 2.18 2.18 0 0 1 4.36 0zM1.82 8.91v3.27c5.52 0 10 4.48 10 10h3.27c0-7.33-5.94-13.27-13.27-13.27zM1.82 2.18v3.27c9.13 0 16.55 7.42 16.55 16.55h3.27c0-10.95-8.87-19.82-19.82-19.82z';

const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  exclude-result-prefixes="atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <!-- The feed's own language element decides which label set renders. -->
  <xsl:variable name="pt" select="starts-with(/rss/channel/language, 'pt')"/>
  <xsl:template match="/">
    <html>
      <xsl:attribute name="lang"><xsl:choose><xsl:when test="$pt">pt-BR</xsl:when><xsl:otherwise>en</xsl:otherwise></xsl:choose></xsl:attribute>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="/rss/channel/title"/></title>
        <style>
          :root { color-scheme: light dark; }
          body {
            margin: 0;
            font-family: ui-sans-serif, system-ui, sans-serif;
            line-height: 1.6;
            background: #fff;
            color: #1a1a1a;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #111; color: #ededed; }
          }
          main { max-width: 42rem; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
          .notice {
            display: flex; gap: .6rem; align-items: flex-start;
            border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
            border-radius: .5rem; padding: .75rem 1rem;
            font-size: .85rem; opacity: .85;
          }
          .notice svg { flex: none; margin-top: .15rem; color: #f26522; }
          h1 { font-size: 1.6rem; letter-spacing: -.02em; margin: 2rem 0 0; }
          .desc { margin: .5rem 0 0; opacity: .8; max-width: 60ch; }
          .visit { display: inline-block; margin-top: 1rem; font-size: .9rem; }
          h2 {
            margin: 3rem 0 0; font-size: .75rem; font-weight: 600;
            letter-spacing: .05em; text-transform: uppercase; opacity: .6;
          }
          article { border-bottom: 1px solid color-mix(in srgb, currentColor 15%, transparent); padding: 1.25rem 0; }
          article:last-of-type { border-bottom: 0; }
          h3 { margin: 0; font-size: 1.05rem; letter-spacing: -.01em; }
          time { font-family: ui-monospace, monospace; font-size: .75rem; opacity: .6; }
          article p { margin: .4rem 0 0; font-size: .9rem; opacity: .8; max-width: 65ch; }
          a { color: inherit; }
          a:hover { opacity: .75; }
        </style>
      </head>
      <body>
        <main>
          <p class="notice">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="${RSS_PATH}"/>
            </svg>
            <span>
              <xsl:choose>
                <xsl:when test="$pt">${esc(pt['rss.feedNotice'])} <a href="https://pt.wikipedia.org/wiki/RSS">${esc(pt['rss.whatIsRss'])}</a></xsl:when>
                <xsl:otherwise>${esc(en['rss.feedNotice'])} <a href="https://aboutfeeds.com">${esc(en['rss.whatIsRss'])}</a></xsl:otherwise>
              </xsl:choose>
            </span>
          </p>

          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
          <a class="visit" href="{/rss/channel/link}">
            <xsl:choose>
              <xsl:when test="$pt">${esc(pt['rss.visitSite'])}</xsl:when>
              <xsl:otherwise>${esc(en['rss.visitSite'])}</xsl:otherwise>
            </xsl:choose>
            <xsl:text> →</xsl:text>
          </a>

          <h2>
            <xsl:choose>
              <xsl:when test="$pt">${esc(pt['rss.recentPosts'])}</xsl:when>
              <xsl:otherwise>${esc(en['rss.recentPosts'])}</xsl:otherwise>
            </xsl:choose>
          </h2>
          <xsl:for-each select="/rss/channel/item">
            <article>
              <h3><a href="{link}"><xsl:value-of select="title"/></a></h3>
              <!-- RFC 822 pubDate; the first 16 chars are the human "Fri, 15 May 2026" part. -->
              <time><xsl:value-of select="substring(pubDate, 1, 16)"/></time>
              <p><xsl:value-of select="description"/></p>
            </article>
          </xsl:for-each>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

export function GET() {
  return new Response(xsl, {
    headers: { 'Content-Type': 'application/xslt+xml; charset=utf-8' },
  });
}
