/**
 * Site search — Option B: D1 + SQLite FTS5, server-rendered, TRUE zero client JS (#search epic).
 *
 * This Pages Function OWNS `GET /{locale}/search`. Its whole pitch is that search fully works with
 * JavaScript disabled: a real `<form method="get">` submits here, we run an FTS5 query against D1,
 * and we inject the results into the SAME static shell every engine shares via HTMLRewriter — no
 * island, no client fetch, no hydration. The browser receives a complete results page.
 *
 * Flow:
 *   1. No / blank `q` (or an unknown locale) → hand the request straight to ASSETS: the static
 *      shell serves the zero-query suggestions state unchanged.
 *   2. With `q` → compose an AND-of-prefix MATCH from the query terms, run it (filtered by locale,
 *      and `type` when a facet is active), order by `bm25`, fetch per-type counts, then rewrite the
 *      shell: input value, count/empty copy, result `<li>`s, filter hrefs/counts/aria-current, and
 *      hide the suggestions block when there are hits.
 *
 * Markup parity: results render through the SHARED `src/lib/search/markup.ts` (imported by a
 * RELATIVE path — the Pages Functions esbuild bundler follows relative imports outside `functions/`)
 * so every engine emits byte-identical result items. Localized strings come from the shared
 * `src/i18n/ui.ts` dictionary (a plain object; its only import is `import type`, elided by esbuild).
 *
 * Security: `q` is user-controlled reflected content. The MATCH expression is built from quoted
 * terms (never interpolated as raw FTS syntax), and ALL rendered text is HTML-escaped — titles and
 * excerpts via the shared `highlight()` (which escapes), and the FTS5 body `snippet()` via a
 * sentinel dance (escape the whole string, then restore only our own `<mark>` markers). No XSS.
 *
 * Analytics (this engine's structural edge — server-side, zero client JS): every successful query
 * bumps `counters(slug='search:{locale}', kind='query')`; zero-result queries also bump `kind='zero'`
 * and record the normalized term into `search_zero_terms` (a content-gap signal, private to the
 * owner via wrangler — no public read endpoint).
 */
import {
  renderResultItem,
  highlight,
  fillTemplate,
  termsOf,
  escapeHtml,
} from '../../src/lib/search/markup';
import { ui } from '../../src/i18n/ui';

// ---------------------------------------------------------------------------------------------
// Minimal D1 / Pages types (functions/** is bundled by Cloudflare's esbuild, outside astro check).
// ---------------------------------------------------------------------------------------------
interface D1Stmt {
  bind(...vals: unknown[]): D1Stmt;
  run(): Promise<{ meta?: { changes?: number } }>;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
}
interface D1Like {
  prepare(sql: string): D1Stmt;
}
interface Assets {
  fetch(input: Request | string | URL): Promise<Response>;
}
interface Env {
  DB?: D1Like;
  ASSETS: Assets;
}
interface Ctx {
  request: Request;
  env: Env;
  params: { locale?: string };
  waitUntil(promise: Promise<unknown>): void;
}

/** The locales this site ships — anything else falls through to ASSETS (404/shell as built). */
type Locale = 'en' | 'pt-br';
function isLocale(v: string | undefined): v is Locale {
  return v === 'en' || v === 'pt-br';
}

/** Searchable facets (mirrors SEARCH_TYPES) — drives `&type=` filtering and the count map. */
const TYPES = ['blog', 'project', 'talk', 'material'] as const;
type SearchType = (typeof TYPES)[number];
function isType(v: string | null): v is SearchType {
  return v === 'blog' || v === 'project' || v === 'talk' || v === 'material';
}

const RESULT_LIMIT = 50;

/** One row read back from the FTS5 table (UNINDEXED columns + the body snippet). */
interface Row {
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
function matchExpr(q: string): string {
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
const MARK_OPEN = 'SMARK';
const MARK_CLOSE = 'EMARK';
const ELLIPSIS = '…';

function snippetToSafeHtml(raw: string): string {
  return escapeHtml(raw).replaceAll(MARK_OPEN, '<mark>').replaceAll(MARK_CLOSE, '</mark>');
}

// ---------------------------------------------------------------------------------------------
// Rendering helpers.
// ---------------------------------------------------------------------------------------------
/**
 * Choose the excerpt HTML for a result. Prefer highlighting the stored `excerpt` (the answer-first
 * display snippet) when it actually contains a term; otherwise fall back to the FTS5 body snippet
 * (the matched window deep in the prose), which we sanitize via the sentinel dance.
 */
function excerptHtmlFor(row: Row, terms: string[]): string {
  const fromExcerpt = highlight(row.excerpt, terms);
  if (fromExcerpt.includes('<mark>')) return fromExcerpt;
  if (row.body_snip) return snippetToSafeHtml(row.body_snip);
  return fromExcerpt; // no match anywhere visible — show the plain (escaped) excerpt
}

/** Parse a row's `meta_json` back into the meta-line segments, tolerating malformed JSON. */
function parseMeta(json: string): { text: string; iso?: string }[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Render the joined `<li>` list for the result rows. */
function renderResults(rows: Row[], terms: string[]): string {
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
// D1 access (wrapped by the caller in try/catch — a fresh local env without the table must not 500).
// ---------------------------------------------------------------------------------------------
interface QueryResult {
  rows: Row[];
  counts: Record<string, number>;
  total: number;
}

async function runSearch(
  db: D1Like,
  match: string,
  locale: Locale,
  type: SearchType | null,
): Promise<QueryResult> {
  // snippet(): column 2 = `body`, with our sentinels, "…" ellipsis, ~18-token window.
  const snip = `snippet(search_fts, 2, '${MARK_OPEN}', '${MARK_CLOSE}', '${ELLIPSIS}', 18)`;
  const typeFilter = type ? ' AND type = ?3' : '';
  const binds: unknown[] = type ? [match, locale, type] : [match, locale];

  const rowsStmt = db
    .prepare(
      `SELECT id, type, url, title, excerpt, type_label, meta_json, ${snip} AS body_snip
       FROM search_fts
       WHERE search_fts MATCH ?1 AND locale = ?2${typeFilter}
       ORDER BY bm25(search_fts)
       LIMIT ${RESULT_LIMIT}`,
    )
    .bind(...binds);

  // Per-type counts for the SAME query (locale-scoped, ignoring the active type facet so the other
  // tabs still show their totals). These drive the `(N)` badges on every filter pill.
  const countStmt = db
    .prepare(
      `SELECT type, count(*) AS n
       FROM search_fts
       WHERE search_fts MATCH ?1 AND locale = ?2
       GROUP BY type`,
    )
    .bind(match, locale);

  const [rowsRes, countRes] = await Promise.all([
    rowsStmt.all<Row>(),
    countStmt.all<{ type: string; n: number }>(),
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const { type: t, n } of countRes.results) {
    counts[t] = n;
    total += n;
  }
  return { rows: rowsRes.results, counts, total };
}

// ---------------------------------------------------------------------------------------------
// Server-side analytics (fire-and-forget via waitUntil) — mirrors the counters conventions of
// functions/api/view.ts. Failures are swallowed: analytics must never break a search response.
// ---------------------------------------------------------------------------------------------
async function recordAnalytics(
  db: D1Like,
  locale: Locale,
  rawQuery: string,
  zero: boolean,
): Promise<void> {
  const slug = `search:${locale}`;
  await db
    .prepare(
      "INSERT INTO counters (slug, kind, count) VALUES (?1, 'query', 1) ON CONFLICT(slug, kind) DO UPDATE SET count = count + 1",
    )
    .bind(slug)
    .run();

  if (!zero) return;

  await db
    .prepare(
      "INSERT INTO counters (slug, kind, count) VALUES (?1, 'zero', 1) ON CONFLICT(slug, kind) DO UPDATE SET count = count + 1",
    )
    .bind(slug)
    .run();

  // Content-gap signal: which queries return nothing. Normalized lowercase/trimmed, ≤80 chars, upserted.
  const term = rawQuery.trim().toLowerCase().slice(0, 80);
  if (!term) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS search_zero_terms (
         term TEXT, locale TEXT, count INTEGER NOT NULL DEFAULT 1,
         PRIMARY KEY (term, locale)
       )`,
    )
    .run();
  await db
    .prepare(
      'INSERT INTO search_zero_terms (term, locale, count) VALUES (?1, ?2, 1) ON CONFLICT(term, locale) DO UPDATE SET count = count + 1',
    )
    .bind(term, locale)
    .run();
}

// ---------------------------------------------------------------------------------------------
// HTMLRewriter transform over the static shell.
// ---------------------------------------------------------------------------------------------
interface TransformOptions {
  shell: Response;
  locale: Locale;
  rawQuery: string;
  activeType: SearchType | null;
  countHtml: string;
  resultsHtml: string;
  hasResults: boolean;
  counts: Record<string, number>;
  total: number;
}

/** Build the `/{locale}/search?...` href for a filter pill, carrying the current query. */
function filterHref(locale: Locale, type: string, rawQuery: string): string {
  const params = new URLSearchParams();
  params.set('q', rawQuery);
  if (type !== 'all') params.set('type', type);
  return `/${locale}/search?${params.toString()}`;
}

/**
 * Rewrite the static shell into a full results page. A fresh `HTMLRewriter` (and a per-request
 * `cursor`) is built on every call — NO module-scoped mutable state — so concurrent requests can't
 * cross-contaminate. The filter-count spans are visited in document order (all, blog, project,
 * talk, material — exactly SearchForm's order), so the cursor maps each span to its count.
 */
function transformShell(opts: TransformOptions): Response {
  const { shell, locale, rawQuery, activeType, countHtml, resultsHtml, hasResults, counts, total } =
    opts;

  const order = ['all', ...TYPES] as const;
  let cursor = 0;

  return (
    new HTMLRewriter()
      // Reflect the query back into the input so the box stays filled.
      .on('#search-q', {
        element(el) {
          el.setAttribute('value', rawQuery);
        },
      })
      // The aria-live count / empty message.
      .on('#search-count', {
        element(el) {
          el.setInnerContent(countHtml, { html: true });
        },
      })
      // The results list.
      .on('#search-results', {
        element(el) {
          el.setInnerContent(resultsHtml, { html: true });
        },
      })
      // Hide the suggestions block when we have hits (kept visible on zero results).
      .on('#search-zero', {
        element(el) {
          if (hasResults) el.setAttribute('hidden', '');
        },
      })
      // Each filter pill: carry the query in the href, mark the active facet.
      .on('#search-filters a[data-type]', {
        element(el) {
          const type = el.getAttribute('data-type') ?? 'all';
          el.setAttribute('href', filterHref(locale, type, rawQuery));
          const isActive = activeType ? type === activeType : type === 'all';
          if (isActive) el.setAttribute('aria-current', 'true');
          else el.removeAttribute('aria-current');
        },
      })
      // The `(N)` count span inside each pill. `all` = total; a missing type = 0.
      .on('#search-filters a[data-type] span[data-count]', {
        element(el) {
          const type = order[cursor++] ?? 'all';
          const n = type === 'all' ? total : (counts[type] ?? 0);
          el.setInnerContent(` (${n})`, { html: false });
        },
      })
      .transform(shell)
  );
}

export async function onRequestGet(context: Ctx): Promise<Response> {
  const { request, env, params } = context;
  const locale = params.locale;

  // Unknown locale → let ASSETS handle it (it serves the built shell or a 404).
  if (!isLocale(locale)) return env.ASSETS.fetch(request);

  const url = new URL(request.url);
  const rawQuery = (url.searchParams.get('q') ?? '').trim();
  const typeParam = url.searchParams.get('type');
  const activeType = isType(typeParam) ? typeParam : null;

  // No query → the static shell already renders the zero-query suggestions state. Serve it as-is.
  if (!rawQuery) return env.ASSETS.fetch(request);

  const match = matchExpr(rawQuery);
  // A query that reduces to no usable terms (e.g. all 1-char) behaves like a blank query.
  if (!match) return env.ASSETS.fetch(request);

  const dict = ui[locale];
  const terms = termsOf(rawQuery);

  // Always fetch the canonical shell (query-less) so HTMLRewriter starts from a clean DOM; the
  // shell's own canonical/noindex/hreflang are pathname-based and already correct for this URL.
  const shellReq = new URL(`/${locale}/search`, request.url);

  let result: QueryResult | null = null;
  let errored = false;
  if (env.DB) {
    try {
      result = await runSearch(env.DB, match, locale, activeType);
    } catch {
      // Table missing (fresh local env) or query failure — degrade to the error state, never 500.
      errored = true;
    }
  } else {
    errored = true;
  }

  const shell = await env.ASSETS.fetch(shellReq);

  // --- Error state: keep the shell usable, show the localized error copy, suggestions visible.
  if (errored || !result) {
    const countHtml = `${escapeHtml(dict['search.error'])} ${escapeHtml(dict['search.error.hint'])}`;
    const res = transformShell({
      shell,
      locale,
      rawQuery,
      activeType,
      countHtml,
      resultsHtml: '',
      hasResults: false,
      counts: {},
      total: 0,
    });
    res.headers.set('cache-control', 'no-store');
    return res;
  }

  // Which rows actually display depends on the active facet; `total`/`counts` span all types.
  const displayed = result.rows;
  const displayedCount = activeType ? (result.counts[activeType] ?? 0) : result.total;
  const hasResults = displayed.length > 0;

  // --- Count / empty copy.
  let countHtml: string;
  if (hasResults) {
    const template =
      displayedCount === 1 ? dict['search.results.count.one'] : dict['search.results.count'];
    countHtml = escapeHtml(fillTemplate(template, { n: displayedCount, q: rawQuery }));
  } else {
    const title = escapeHtml(fillTemplate(dict['search.empty.title'], { q: rawQuery }));
    const hint = escapeHtml(dict['search.empty.hint']);
    countHtml = `${title} ${hint}`;
  }

  const resultsHtml = hasResults ? renderResults(displayed, terms) : '';

  const res = transformShell({
    shell,
    locale,
    rawQuery,
    activeType,
    countHtml,
    resultsHtml,
    hasResults,
    counts: result.counts,
    total: result.total,
  });

  // Cache non-empty result pages briefly (the index only changes at deploy/sync); never cache the
  // empty state (so a freshly-synced index surfaces results without a stale "no results" page).
  res.headers.set('cache-control', hasResults ? 'public, max-age=300' : 'no-store');

  // Fire-and-forget analytics — bump query/zero counters + record zero-result terms.
  if (env.DB) {
    context.waitUntil(recordAnalytics(env.DB, locale, rawQuery, !hasResults).catch(() => {}));
  }

  return res;
}
