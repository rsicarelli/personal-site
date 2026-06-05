/**
 * Site search — Option D: D1 + SQLite FTS5, progressive-enhancement HYBRID (#search epic).
 *
 * This Pages Function OWNS `GET /{locale}/search`. Its baseline pitch is unchanged from Option B:
 * search fully works with JavaScript disabled — a real `<form method="get">` submits here, we run an
 * FTS5 query against D1, and inject results into the SAME static shell every engine shares via
 * HTMLRewriter. No island, no client fetch, no hydration; the browser receives a complete page.
 *
 * Option D adds a SECOND response shape on the SAME endpoint for the instant-feel island
 * (`src/scripts/search-d1-hybrid.ts`): when the request asks for JSON (`?format=json` OR
 * `Accept: application/json`), we serialize `{ q, locale, activeType, total, counts, hasResults,
 * terms, results:[{url,title,typeLabel,meta,excerptHtml}] }` instead of rewriting the shell. The
 * island debounce-fetches that JSON per keystroke and renders client-side through the SAME
 * `src/lib/search/markup.ts`, so server- and client-rendered results are byte-identical. No-JS is a
 * strict subset: the HTML path below is untouched.
 *
 * Flow:
 *   1. No / blank `q` (or an unknown locale) → hand the request straight to ASSETS: the static
 *      shell serves the zero-query suggestions state unchanged (HTML only — the island never fetches
 *      a blank query).
 *   2. With `q` → compose an AND-of-prefix MATCH, run it (locale-scoped, `type`-filtered when a
 *      facet is active) through the edge Cache API (Stage 2) → `runSearch`, then branch:
 *        - JSON intent → `Response(JSON)` via `buildJsonPayload`.
 *        - else → rewrite the shell (input value, count/empty copy, result `<li>`s, filter
 *          hrefs/counts/aria-current, hide suggestions on hits).
 *
 * Pure logic (MATCH composition, the XSS-safe snippet dance, the JSON serializer, filter hrefs,
 * locale/type guards) lives in the importable, unit-tested `src/lib/search/server.ts` (imported by a
 * RELATIVE path — the Pages Functions esbuild bundler follows relative imports outside `functions/`).
 * This handler keeps only the un-unit-testable shell: D1, HTMLRewriter, the Cache API, `waitUntil`.
 *
 * Analytics split (Option D): `recordAnalytics` (D1 counters + zero-terms) fires on the HTML path
 * ONLY — committed/no-JS/deep-link searches. The JSON path does NOT write D1: it's hit once per
 * keystroke, which would inflate the write budget, so the island reports via Umami instead.
 *
 * Edge cache (Stage 2): the D1 read is wrapped in `caches.default` keyed by the normalized GET URL,
 * so repeat/popular queries skip D1. It activates ONLY on the custom domain — `caches.default` is a
 * no-op on `*.pages.dev`/previews — and is fully feature-detected + try/caught so it can never break
 * a response.
 */
import { fillTemplate, termsOf, escapeHtml } from '../../src/lib/search/markup';
import {
  type Locale,
  type SearchType,
  type Row,
  TYPES,
  RESULT_LIMIT,
  MARK_OPEN,
  MARK_CLOSE,
  ELLIPSIS,
  isLocale,
  isType,
  matchExpr,
  renderResults,
  filterHref,
  buildJsonPayload,
  errorJsonPayload,
  wantsJson,
} from '../../src/lib/search/server';
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
// HTML PATH ONLY (Option D analytics split) — the JSON path reports via Umami client-side instead.
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
// Edge Cache API (Stage 2) — repeat/popular queries skip D1, protecting its read budget.
// ---------------------------------------------------------------------------------------------
// Wrap the response in `caches.default` under a NORMALIZED key (lowercased/trimmed q + type +
// locale + format), so `?q=Kotlin` and `?q=kotlin ` share a cache entry. Feature-detected + fully
// try/caught: on `*.pages.dev`/previews `caches.default` is a no-op, and any failure degrades to a
// fresh `runSearch` — the cache must NEVER break a response. Only activates on the custom domain.

interface CacheLike {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
}
declare const caches: { default?: CacheLike } | undefined;

/** The normalized GET request used as the cache key (separate from the user's actual request). */
function cacheKeyRequest(
  url: URL,
  locale: Locale,
  type: SearchType | null,
  format: string,
): Request {
  const key = new URL(`/${locale}/search`, url);
  key.searchParams.set('q', (url.searchParams.get('q') ?? '').trim().toLowerCase());
  if (type) key.searchParams.set('type', type);
  if (format === 'json') key.searchParams.set('format', 'json');
  return new Request(key.toString(), { method: 'GET' });
}

function edgeCache(): CacheLike | null {
  try {
    if (typeof caches !== 'undefined' && caches && caches.default) return caches.default;
  } catch {
    // `caches` undeclared / inaccessible (preview) — no-op.
  }
  return null;
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
  const json = wantsJson(url, request.headers.get('accept'));
  const format = json ? 'json' : 'html';

  // No query → the static shell already renders the zero-query suggestions state. Serve it as-is.
  // (The island never fetches a blank query, so a JSON path here isn't needed.)
  if (!rawQuery) return env.ASSETS.fetch(request);

  const match = matchExpr(rawQuery);
  // A query that reduces to no usable terms (e.g. all 1-char) behaves like a blank query.
  if (!match) return env.ASSETS.fetch(request);

  // --- Stage 2: edge cache lookup (normalized key). No-op/no-throw where unavailable.
  const cache = edgeCache();
  const cacheReq = cache ? cacheKeyRequest(url, locale, activeType, format) : null;
  if (cache && cacheReq) {
    try {
      const hit = await cache.match(cacheReq);
      if (hit) return hit;
    } catch {
      // Cache read failed — fall through to a fresh query.
    }
  }

  const dict = ui[locale];
  const terms = termsOf(rawQuery);

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

  // -------------------------------------------------------------------------------------------
  // JSON path (the instant island). No D1 analytics here — the island reports via Umami.
  // -------------------------------------------------------------------------------------------
  if (json) {
    const payload =
      errored || !result
        ? errorJsonPayload(rawQuery, locale, activeType)
        : buildJsonPayload({
            rawQuery,
            locale,
            activeType,
            rows: result.rows,
            counts: result.counts,
            total: result.total,
          });
    const res = new Response(JSON.stringify(payload), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Error/empty: never cache (so a freshly-synced index surfaces results). Hits: short TTL.
        'cache-control': payload.hasResults ? 'public, max-age=300, s-maxage=300' : 'no-store',
      },
    });
    if (cache && cacheReq && payload.hasResults) cacheAndForget(context, cache, cacheReq, res);
    return res;
  }

  // -------------------------------------------------------------------------------------------
  // HTML path (the no-JS baseline — Option B, unchanged) + D1 analytics.
  // -------------------------------------------------------------------------------------------
  // Always fetch the canonical shell (query-less) so HTMLRewriter starts from a clean DOM; the
  // shell's own canonical/noindex/hreflang are pathname-based and already correct for this URL.
  const shellReq = new URL(`/${locale}/search`, request.url);
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
  res.headers.set('cache-control', hasResults ? 'public, max-age=300, s-maxage=300' : 'no-store');

  // Stage 2: store non-empty HTML in the edge cache too (normalized key).
  if (cache && cacheReq && hasResults) cacheAndForget(context, cache, cacheReq, res);

  // Fire-and-forget analytics — bump query/zero counters + record zero-result terms. HTML PATH ONLY.
  if (env.DB) {
    context.waitUntil(recordAnalytics(env.DB, locale, rawQuery, !hasResults).catch(() => {}));
  }

  return res;
}

/** `cache.put` a clone, fire-and-forget — failures are swallowed (the live response is unaffected). */
function cacheAndForget(context: Ctx, cache: CacheLike, req: Request, res: Response): void {
  try {
    context.waitUntil(cache.put(req, res.clone()).catch(() => {}));
  } catch {
    // `res.clone()`/`put` unavailable — no-op.
  }
}
