import { LOCALES } from '@/config/site';
import { buildSearchCorpus } from '@/lib/search/corpus';
import type { SearchDoc } from '@/lib/search/types';

/**
 * Build-time search corpus dump (Option B — D1 FTS5) — emits `{ docs }` for BOTH locales into
 * `dist/search-corpus.json`. This is the bridge OUT of the Astro build: `buildSearchCorpus` reads
 * `astro:content`, which only exists inside an Astro build, so the D1 index-sync script
 * (`scripts/search-index-sync.mjs`) consumes THIS artifact rather than importing the corpus module.
 *
 * Each doc carries its `locale` (so the sync writes the `locale` UNINDEXED FTS column) and the full
 * `body` (the sync truncates it). Public content only — nothing here isn't already on a public page,
 * so shipping the file is harmless; clients never fetch it (the D1 Pages Function renders results,
 * not the browser). It's robots-irrelevant (no inbound links) and excluded from the sitemap by being
 * a `.json.ts` endpoint, not a page.
 */
export async function GET(): Promise<Response> {
  const perLocale = await Promise.all(
    LOCALES.map(async (locale) => {
      const docs = await buildSearchCorpus(locale);
      // Tag each doc with its locale so the sync script can write the `locale` FTS column without
      // re-deriving it from the (locale-prefixed) URL.
      return docs.map((doc) => ({ ...doc, locale }));
    }),
  );
  const docs: (SearchDoc & { locale: string })[] = perLocale.flat();
  return new Response(JSON.stringify({ docs }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
