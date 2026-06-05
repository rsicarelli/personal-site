/**
 * Search server-core — the PURE, dependency-light logic shared by the `GET /{locale}/search`
 * Pages Function (`functions/[locale]/search.ts`) and its unit tests. Extracting it here keeps the
 * handler itself thin (D1, HTMLRewriter, the edge Cache API, `waitUntil`) while every decision that
 * can be tested headlessly — MATCH composition, the XSS-safe snippet dance, the JSON serializer,
 * filter hrefs, locale/type guards — lives in one importable, Vitest-covered module. No untested
 * logic hides in the handler.
 *
 * Like `src/lib/search/markup.ts`, this module is intentionally DEPENDENCY-LIGHT (its only imports
 * are sibling search libs + an `import type` from i18n, both elided/inlined by the Functions esbuild
 * bundler) so the Pages Function can import it by a RELATIVE path from outside `functions/`.
 *
 * Security: `q` is user-controlled, reflected content. `matchExpr` builds the FTS5 MATCH from quoted
 * terms (never interpolated raw FTS syntax). `snippetToSafeHtml`/`excerptHtmlFor`/`renderResults`
 * all route reflected text through the shared `escapeHtml`/`highlight` (which escape), and the FTS5
 * body `snippet()` through a sentinel dance: escape the whole string first, then restore ONLY our
 * own private markers to `<mark>` — markup the content itself can never forge.
 */
import { renderResultItem, highlight, termsOf, escapeHtml } from './markup';

// ---------------------------------------------------------------------------------------------
// Locale / type tokens + guards (mirrors src/config/site + src/lib/search/types, inlined so this
// module stays importable from the Functions bundle without pulling the `astro:*` import chain).
// ---------------------------------------------------------------------------------------------
/** The locales this site ships — anything else falls through to ASSETS (404/shell as built). */
export type Locale = 'en' | 'pt-br';
export function isLocale(v: string | undefined): v is Locale {
  return v === 'en' || v === 'pt-br';
}

/** Searchable facets (mirrors SEARCH_TYPES) — drives `&type=` filtering and the count map. */
export const TYPES = ['blog', 'project', 'talk', 'material'] as const;
export type SearchType = (typeof TYPES)[number];
export function isType(v: string | null): v is SearchType {
  return v === 'blog' || v === 'project' || v === 'talk' || v === 'material';
}

/** Max result rows read back per query (the listing caps; counts span all matches). */
export const RESULT_LIMIT = 50;

/** One row read back from the FTS5 table (UNINDEXED columns + the body snippet). */
export interface Row {
  id: string;
  type: string;
  url: string;
  title: string;
  excerpt: string;
  type_label: string;
  meta_json: string;
  body_snip: string;
}

// ---------------------------------------------------------------------------------------------
// MATCH composition — quoted prefix terms joined by spaces = AND (FTS5 implicit AND).
// ---------------------------------------------------------------------------------------------
/**
 * Build a safe FTS5 MATCH expression from a raw query: reuse the shared `termsOf` (whitespace
 * split, length ≥ 2, max 8), strip FTS syntax characters from each term, wrap in double quotes
 * (so the term is a literal, never an operator/column filter), and append `*` for prefix matching.
 * Joining with spaces ANDs them. Returns `''` when no usable term remains (caller treats as blank).
 */
export function matchExpr(q: string): string {
  const terms = termsOf(q)
    // Drop the FTS5 metacharacters (quotes, parens, colon, star, caret, minus) so the term can't
    // break out of its quotes or change query semantics. Diacritics are folded by the tokenizer.
    .map((t) => t.replace(/["()*:^-]/g, '').trim())
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return '';
  return terms.map((t) => `"${t}"*`).join(' ');
}

// ---------------------------------------------------------------------------------------------
// FTS5 body snippet → safe highlighted HTML.
// ---------------------------------------------------------------------------------------------
// `snippet()` returns RAW text from the stored body with our markers around matches. We pass
// unlikely sentinels (not HTML), so we can HTML-escape the entire string first (neutralizing any
// `<`,`>`,`&` from the content) and only THEN swap our sentinels for real <mark> tags — markup the
// content itself can never forge. This is the XSS-safe path for reflected body text.
export const MARK_OPEN = 'SMARK';
export const MARK_CLOSE = 'EMARK';
export const ELLIPSIS = '…';

export function snippetToSafeHtml(raw: string): string {
  return escapeHtml(raw).replaceAll(MARK_OPEN, '<mark>').replaceAll(MARK_CLOSE, '</mark>');
}

/**
 * Choose the excerpt HTML for a result. Prefer highlighting the stored `excerpt` (the answer-first
 * display snippet) when it actually contains a term; otherwise fall back to the FTS5 body snippet
 * (the matched window deep in the prose), which we sanitize via the sentinel dance.
 */
export function excerptHtmlFor(row: Row, terms: string[]): string {
  const fromExcerpt = highlight(row.excerpt, terms);
  if (fromExcerpt.includes('<mark>')) return fromExcerpt;
  if (row.body_snip) return snippetToSafeHtml(row.body_snip);
  return fromExcerpt; // no match anywhere visible — show the plain (escaped) excerpt
}

/** Parse a row's `meta_json` back into the meta-line segments, tolerating malformed JSON. */
export function parseMeta(json: string): { text: string; iso?: string }[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Render the joined `<li>` list for the result rows (server HTML path). */
export function renderResults(rows: Row[], terms: string[]): string {
  return rows
    .map((row) => {
      const meta = parseMeta(row.meta_json);
      const doc = {
        url: row.url,
        title: row.title,
        excerpt: row.excerpt,
        typeLabel: row.type_label,
        meta,
      };
      return renderResultItem(doc, terms, { excerptHtml: excerptHtmlFor(row, terms) });
    })
    .join('');
}

// ---------------------------------------------------------------------------------------------
// Filter hrefs.
// ---------------------------------------------------------------------------------------------
/** Build the `/{locale}/search?...` href for a filter pill, carrying the current query. */
export function filterHref(locale: Locale, type: string, rawQuery: string): string {
  const params = new URLSearchParams();
  params.set('q', rawQuery);
  if (type !== 'all') params.set('type', type);
  return `/${locale}/search?${params.toString()}`;
}

// ---------------------------------------------------------------------------------------------
// JSON serializer (the instant-island contract).
// ---------------------------------------------------------------------------------------------
/** One result object in the JSON payload — `excerptHtml` is the SAME trusted snippet HTML the
 * HTML path renders (already escaped + sentinel-restored), so the island injects it verbatim. */
export interface SearchJsonResult {
  url: string;
  title: string;
  typeLabel: string;
  meta: { text: string; iso?: string }[];
  excerptHtml: string;
}

/** The JSON body shape the island fetches (`?format=json`). `hasResults:false` (+ optional
 * `error`) maps onto the shell's `data-empty`/`data-error` templates client-side. */
export interface SearchJsonPayload {
  q: string;
  locale: Locale;
  activeType: SearchType | null;
  total: number;
  counts: Record<SearchType, number>;
  hasResults: boolean;
  terms: string[];
  results: SearchJsonResult[];
  error?: true;
}

/** Normalize the per-type count map to a dense `{blog,project,talk,material}` (0 for missing). */
export function denseCounts(counts: Record<string, number>): Record<SearchType, number> {
  return {
    blog: counts.blog ?? 0,
    project: counts.project ?? 0,
    talk: counts.talk ?? 0,
    material: counts.material ?? 0,
  };
}

/**
 * Build the JSON payload from a (successful) query result. `displayedCount` is the count for the
 * active facet (or `total` when "all"); `hasResults` reflects the displayed rows. The island reads
 * `counts` for the per-pill `(N)` badges and `terms` to re-highlight the title client-side.
 */
export function buildJsonPayload(args: {
  rawQuery: string;
  locale: Locale;
  activeType: SearchType | null;
  rows: Row[];
  counts: Record<string, number>;
  total: number;
}): SearchJsonPayload {
  const { rawQuery, locale, activeType, rows, counts, total } = args;
  const terms = termsOf(rawQuery);
  const results: SearchJsonResult[] = rows.map((row) => ({
    url: row.url,
    title: row.title,
    typeLabel: row.type_label,
    meta: parseMeta(row.meta_json),
    excerptHtml: excerptHtmlFor(row, terms),
  }));
  return {
    q: rawQuery,
    locale,
    activeType,
    total,
    counts: denseCounts(counts),
    hasResults: results.length > 0,
    terms,
    results,
  };
}

/** The error/unavailable JSON payload — `hasResults:false` + `error:true` for the island. */
export function errorJsonPayload(
  rawQuery: string,
  locale: Locale,
  activeType: SearchType | null,
): SearchJsonPayload {
  return {
    q: rawQuery,
    locale,
    activeType,
    total: 0,
    counts: denseCounts({}),
    hasResults: false,
    terms: termsOf(rawQuery),
    results: [],
    error: true,
  };
}

// ---------------------------------------------------------------------------------------------
// Content negotiation.
// ---------------------------------------------------------------------------------------------
/** JSON intent: explicit `?format=json` OR an `Accept: application/json` header (the island sends
 * both; crawlers/no-JS browsers get HTML). */
export function wantsJson(url: URL, accept: string | null): boolean {
  if (url.searchParams.get('format') === 'json') return true;
  return (accept ?? '').toLowerCase().includes('application/json');
}
