import { LOCALES, type Locale } from '@/config/site';
import { buildSearchCorpus } from '@/lib/search/corpus';

/**
 * Per-locale Orama search index payload (Option C) — `GET /{locale}/search-index.json`.
 *
 * This is the ENTIRE corpus the client island downloads on first search intent: one JSON document
 * per locale, statically prebuilt at build time (no runtime DB, no Pages Function). The island
 * lazily fetches it, builds an in-memory Orama db, and runs typo-tolerant full-text search fully
 * client-side. Trade-off documented in the PR: the whole locale index ships before the first
 * result (no sharding), and it grows linearly with content — so we keep the payload lean here.
 *
 * Leanness levers:
 *  - `body` is truncated to ~1500 chars per doc. The lede/title/tags carry most of the relevance
 *    signal; the long tail of an article body mostly inflates the payload without improving recall
 *    for short queries. (Orama still indexes the truncated body, so deep matches in the first
 *    ~1500 chars are found; matches only in the tail are the accepted cost of a small index.)
 *  - We emit exactly the fields the island needs: everything `RenderableDoc` requires for
 *    `renderResultItem` (url, title, excerpt, typeLabel, meta) PLUS the index-only fields
 *    (`type`, `tags`, truncated `body`). Nothing else.
 *
 * Cache-Control mirrors the sibling `engagement/slugs.json` endpoint; on Cloudflare Pages the
 * immutable build hash in the asset path means the short max-age is just a freshness floor.
 */

/** Max indexable body length per doc — keeps the per-locale payload well under the ~300KB budget. */
const BODY_MAX_CHARS = 1500;

export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export async function GET({ params }: { params: { locale: Locale } }): Promise<Response> {
  const corpus = await buildSearchCorpus(params.locale);

  // Project each SearchDoc to the lean wire shape the island indexes + renders. `body` is the only
  // field we trim; everything else is already display-sized (title, excerpt, baked meta line).
  const docs = corpus.map((d) => ({
    id: d.id,
    type: d.type,
    url: d.url,
    title: d.title,
    excerpt: d.excerpt,
    typeLabel: d.typeLabel,
    tags: d.tags,
    meta: d.meta,
    body: d.body.length > BODY_MAX_CHARS ? d.body.slice(0, BODY_MAX_CHARS) : d.body,
  }));

  return new Response(JSON.stringify({ docs }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
