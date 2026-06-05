import type { APIContext } from 'astro';
import { LOCALES, type Locale } from '@/config/site';
import { buildSearchCorpus } from '@/lib/search/corpus';
import { termsFromCorpus } from '@/lib/search/typo';

/**
 * Per-locale typo dictionary (Stage 3 of the search hybrid) — `GET /{locale}/search-terms.json`
 * emits `{ terms: string[] }`: the unique, high-signal tokens from corpus titles + tags, lowercased
 * and deduped (see `termsFromCorpus`). The instant island lazy-loads this on first focus and uses it
 * to correct near-miss queries (`kotln` → `kotlin`) BEFORE fetching results — so typo tolerance is a
 * client enhancement, never a D1/`fts5vocab` round-trip.
 *
 * Statically prerendered for both locales (one tiny JSON per locale). Public content only — every
 * token already appears on a public page — so shipping it is harmless. It's an endpoint, not a page:
 * excluded from the sitemap and robots-irrelevant (no inbound links).
 */
export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export async function GET({ params }: APIContext): Promise<Response> {
  const locale = params.locale as Locale;
  const docs = await buildSearchCorpus(locale);
  const terms = termsFromCorpus(docs);
  return new Response(JSON.stringify({ terms }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
