/**
 * Search island — Option C: Orama (build-time JSON index + small client engine).
 *
 * Loaded from `src/pages/[locale]/search/index.astro` via a PROCESSED `<script>` (Astro bundles &
 * hashes it under 'self', so NO CSP `script-src` change is needed — unlike a WASM engine, which
 * would also need `wasm-unsafe-eval`). Renders results through the shared, dependency-free
 * `renderResultItem` so the markup is byte-identical to every sibling PR.
 *
 * Lifecycle / cost model:
 *  - The Orama db and the (potentially large) index JSON are loaded LAZILY — only on the first
 *    real search intent (focus or keystroke), or immediately on load when the page already carries
 *    `?q=` (a shared/deep-linked search). A visitor who lands on `/search` and leaves without
 *    typing pays ZERO bytes for the engine data. The engine module itself is a tiny hashed chunk.
 *  - Orama core is modular (~2KB); we import only `create`/`insertMultiple`/`search` plus the
 *    per-locale stemmer (`english` / `portuguese`) so pt-BR queries stem like the corpus.
 *
 * Re-initialization: everything binds on `astro:page-load`, which fires on first load AND after
 * every View Transitions swap (#49), so search keeps working across client-side navigation. State
 * is module-scoped and re-derived from the live DOM each time, so a swap to a different locale's
 * `/search` re-reads the new `#search` data-* and lazily loads that locale's index on next intent.
 */

import { create, insertMultiple, search, type Orama, type Results } from '@orama/orama';
import { renderResultItem, fillTemplate, termsOf, type RenderableDoc } from '@/lib/search/markup';
import { trackSearch, trackResultClick } from '@/lib/search/analytics';
import { SEARCH_TYPES, type SearchType } from '@/lib/search/types';
import type { Locale } from '@/config/site';

/** A type filter token: one of the content types, or `all` (no `type` constraint). */
type TypeFilter = SearchType | 'all';

/** Wire-shape doc from `/{locale}/search-index.json` — `RenderableDoc` + the index-only fields. */
interface IndexedDoc extends RenderableDoc {
  id: string;
  type: SearchType;
  tags: string[];
  body: string;
}

/** Localized templates + locale, read once from the `#search` wrapper's data-* attributes. */
interface SearchStrings {
  locale: Locale;
  count: string;
  countOne: string;
  empty: string;
  emptyHint: string;
  error: string;
  errorHint: string;
  loading: string;
}

/**
 * The Orama document schema. `tags` is a string array; everything else is a plain string. Numbers
 * (dates, reading time) live only in the pre-baked `meta` line and are NOT indexed — search is over
 * title/excerpt/body/tags, matching the `properties` we pass to `search()`.
 */
const SCHEMA = {
  title: 'string',
  excerpt: 'string',
  body: 'string',
  tags: 'string[]',
  type: 'string',
} as const;

type SearchDb = Orama<typeof SCHEMA>;

/**
 * `search()` is typed as `Results | Promise<Results>` because some custom stores resolve
 * asynchronously, but the default in-memory store (the only one we use) is synchronous. This thin
 * wrapper narrows the return so callers don't have to. `params` stays loosely typed (`any`) to
 * sidestep Orama's deeply-generic `SearchParams` inference — the values we pass are validated by
 * the schema + `properties`/`where` at runtime.
 */
function query0(db: SearchDb, params: Record<string, unknown>): Results<IndexedDoc> {
  return search(db, params as never) as Results<IndexedDoc>;
}

/** Per-island lazy state — reset on each `astro:page-load` so a locale/page swap starts clean. */
interface EngineState {
  /** The wrapper element this state was initialized against (guards against stale handlers). */
  root: HTMLElement;
  strings: SearchStrings;
  db: SearchDb | null;
  /** All docs by id, so we can map Orama hits back to the full renderable/typed doc. */
  byId: Map<string, IndexedDoc>;
  /** A promise that resolves once the index is fetched + the db is built (or rejects on failure). */
  loading: Promise<void> | null;
  /** Active type filter, mirrored to `?type=`. */
  type: TypeFilter;
  /** Debounce handle for input. */
  debounce: number | null;
}

let state: EngineState | null = null;

/** Read the localized templates + locale off the `#search` wrapper (set server-side in the shell). */
function readStrings(root: HTMLElement): SearchStrings {
  const d = root.dataset;
  return {
    locale: (d.locale ?? 'en') as Locale,
    count: d.count ?? '{n}',
    countOne: d.countOne ?? '{n}',
    empty: d.empty ?? '',
    emptyHint: d.emptyHint ?? '',
    error: d.error ?? '',
    errorHint: d.errorHint ?? '',
    loading: d.loading ?? '',
  };
}

/** Validate an untrusted `type` param against the known tokens (anything else → `all`). */
function parseType(raw: string | null): TypeFilter {
  return raw && (SEARCH_TYPES as readonly string[]).includes(raw) ? (raw as SearchType) : 'all';
}

/** Lazily import the per-locale stemmer and build the Orama db. Imported dynamically so the stemmer
 * bundle only downloads when the visitor actually searches (and only the locale they're on). */
async function buildDb(docs: IndexedDoc[], locale: Locale): Promise<SearchDb> {
  // `english` / `portuguese` are both first-class Orama languages; we supply the matching stemmer so
  // pt-BR queries ("funções" ↔ "função") and en queries stem consistently with the indexed corpus.
  const { stemmer, language } =
    locale === 'pt-br'
      ? await import('@orama/stemmers/portuguese')
      : await import('@orama/stemmers/english');

  const db = create({
    schema: SCHEMA,
    components: { tokenizer: { language, stemming: true, stemmer } },
  });
  await insertMultiple(db, docs);
  return db;
}

/**
 * Kick off (once) the lazy load: fetch the locale index, build the db, index it. Subsequent calls
 * return the in-flight / settled promise. On failure the promise rejects and callers render the
 * error state.
 */
function ensureLoaded(s: EngineState): Promise<void> {
  if (s.loading) return s.loading;
  s.loading = (async () => {
    const res = await fetch(`/${s.strings.locale}/search-index.json`);
    if (!res.ok) throw new Error(`search-index ${res.status}`);
    const { docs } = (await res.json()) as { docs: IndexedDoc[] };
    s.byId = new Map(docs.map((d) => [d.id, d]));
    s.db = await buildDb(docs, s.strings.locale);
  })();
  return s.loading;
}

/** The `#search-count` aria-live paragraph (count / empty / error / loading messages land here). */
function countEl(root: HTMLElement): HTMLParagraphElement {
  return root.querySelector<HTMLParagraphElement>('#search-count')!;
}
function resultsEl(root: HTMLElement): HTMLUListElement {
  return root.querySelector<HTMLUListElement>('#search-results')!;
}
function zeroEl(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('#search-zero');
}
function inputEl(root: HTMLElement): HTMLInputElement {
  return root.querySelector<HTMLInputElement>('#search-q')!;
}

/** Reflect the active filter onto the pills: `aria-current` on the active one, `(N)` counts, and
 * hrefs that carry the current query so the no-JS/links stay shareable. */
function paintFilters(root: HTMLElement, q: string, counts: Record<TypeFilter, number>): void {
  const links = root.querySelectorAll<HTMLAnchorElement>('#search-filters a[data-type]');
  const qParam = q ? `q=${encodeURIComponent(q)}` : '';
  for (const a of links) {
    const type = (a.dataset.type ?? 'all') as TypeFilter;
    const active = type === state!.type;
    if (active) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');

    // Count badge: ` (N)` for the current query, blank when there's no query.
    const badge = a.querySelector<HTMLElement>('span[data-count]');
    if (badge) badge.textContent = q ? ` (${counts[type] ?? 0})` : '';

    // Keep the href a real, shareable search URL carrying the current q + this pill's type.
    const parts = [qParam, type === 'all' ? '' : `type=${type}`].filter(Boolean);
    const base = `/${state!.strings.locale}/search`;
    a.setAttribute('href', parts.length ? `${base}?${parts.join('&')}` : base);
  }
}

/** Sync `?q=`/`&type=` into the address bar without a navigation (shareable, back-button-friendly). */
function syncUrl(q: string, type: TypeFilter): void {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (type !== 'all') params.set('type', type);
  const qs = params.toString();
  history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
}

/** Show a single status line in `#search-count`, clear results, keep the zero block visible. */
function showStatus(root: HTMLElement, message: string): void {
  countEl(root).textContent = message;
  resultsEl(root).innerHTML = '';
  zeroEl(root)?.removeAttribute('hidden');
}

/**
 * Run a search for `q` under the active type filter and paint everything: results list, count line,
 * filter pills, the zero block's visibility, the URL, and analytics. Assumes the db is loaded.
 */
function runSearch(s: EngineState, q: string): void {
  const root = s.root;
  const trimmed = q.trim();
  syncUrl(trimmed, s.type);

  // Zero query → no result list; keep the suggestions/zero block visible, clear the count line.
  if (!trimmed) {
    countEl(root).textContent = '';
    resultsEl(root).innerHTML = '';
    zeroEl(root)?.removeAttribute('hidden');
    paintFilters(root, '', emptyCounts());
    return;
  }
  if (!s.db) return; // not loaded yet — caller (ensureLoaded) re-invokes once ready

  // Unfiltered pass: drives the per-type pill counts via Orama facets, independent of the filter.
  const all = query0(s.db, {
    term: trimmed,
    tolerance: 1,
    boost: { title: 3, excerpt: 2, tags: 2 },
    properties: ['title', 'excerpt', 'body', 'tags'],
    limit: 1, // hits unused here — we only want the facet tallies + total `count`
    facets: { type: {} },
  });
  const counts = countsFromFacets(all.facets?.type?.values, all.count);

  // The actual (possibly type-filtered) result set we render.
  const hits = query0(s.db, {
    term: trimmed,
    tolerance: 1,
    boost: { title: 3, excerpt: 2, tags: 2 },
    properties: ['title', 'excerpt', 'body', 'tags'],
    limit: 50,
    where: s.type === 'all' ? undefined : { type: s.type },
  });

  const terms = termsOf(trimmed);
  const items = hits.hits
    .map((h) => s.byId.get(String(h.id)))
    .filter((d): d is IndexedDoc => d != null)
    .map((d) => renderResultItem(d, terms));

  paintFilters(root, trimmed, counts);

  if (items.length === 0) {
    // Empty results: show "No results for …" + hint, keep the zero/suggestions block visible.
    countEl(root).textContent =
      `${fillTemplate(s.strings.empty, { q: trimmed })} ${s.strings.emptyHint}`.trim();
    resultsEl(root).innerHTML = '';
    zeroEl(root)?.removeAttribute('hidden');
  } else {
    const tpl = items.length === 1 ? s.strings.countOne : s.strings.count;
    countEl(root).textContent = fillTemplate(tpl, { n: items.length, q: trimmed });
    resultsEl(root).innerHTML = items.join('');
    zeroEl(root)?.setAttribute('hidden', '');
  }

  // Analytics: counts are over the rendered (filtered) set; `trackSearch` fires `search-zero` for us.
  trackSearch(trimmed, items.length, s.type, s.strings.locale);
}

/** All-zero per-type count map (used when there is no query). */
function emptyCounts(): Record<TypeFilter, number> {
  return { all: 0, blog: 0, project: 0, talk: 0, material: 0 };
}

/** Build the pill count map from Orama's `type` facet values (+ the unfiltered total for `all`). */
function countsFromFacets(
  values: Record<string, number> | undefined,
  total: number,
): Record<TypeFilter, number> {
  const counts = emptyCounts();
  counts.all = total;
  if (values) for (const type of SEARCH_TYPES) counts[type] = values[type] ?? 0;
  return counts;
}

/**
 * Entry point for a query: ensure the db is loaded (showing the loading status while it downloads),
 * then run the search. Errors in the index fetch / engine init fall back to the error state.
 */
async function query(s: EngineState, q: string): Promise<void> {
  const trimmed = q.trim();
  // Zero query needs no engine — render the zero state immediately (and don't trigger a download).
  if (!trimmed) {
    runSearch(s, q);
    return;
  }
  if (!s.db) showStatus(s.root, s.strings.loading);
  try {
    await ensureLoaded(s);
  } catch {
    // Index fetch or engine init failed → error line + hint, keep the zero block visible.
    showStatus(s.root, `${s.strings.error} ${s.strings.errorHint}`.trim());
    return;
  }
  // Guard against a locale/page swap that replaced `state` while we were awaiting the download.
  if (state === s) runSearch(s, q);
}

/** Wire all event handlers for a freshly-initialized search page. */
function bind(s: EngineState): void {
  const root = s.root;
  const input = inputEl(root);
  const form = root.querySelector<HTMLFormElement>('#search-form');

  // Debounced typing (~200ms). The FIRST keystroke also implicitly triggers the lazy load via query.
  input.addEventListener('input', () => {
    if (s.debounce != null) clearTimeout(s.debounce);
    s.debounce = window.setTimeout(() => void query(s, input.value), 200);
  });

  // Lazy warm-up: start fetching the index on first focus, before the visitor finishes typing, so
  // the first result feels instant. Cheap no-op if already loading/loaded.
  input.addEventListener(
    'focus',
    () => {
      void ensureLoaded(s).catch(() => {
        /* surfaced on the next actual query() */
      });
    },
    { once: true },
  );

  // Intercept the GET form submit → search in place (no navigation/reload).
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (s.debounce != null) clearTimeout(s.debounce);
    void query(s, input.value);
  });

  // Filter pills: switch the active type and re-filter client-side (no navigation).
  root.querySelector('#search-filters')?.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-type]');
    if (!link) return;
    e.preventDefault();
    s.type = (link.dataset.type ?? 'all') as TypeFilter;
    void query(s, input.value);
  });

  // Result clicks: capture-phase so we read position/type BEFORE navigation starts.
  resultsEl(root).addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!a) return;
      const items = Array.from(resultsEl(root).querySelectorAll('li'));
      const li = a.closest('li');
      const position = li ? items.indexOf(li) + 1 : 0;
      // Map the clicked result back to its doc type via the href (urls are unique per doc).
      const doc = [...s.byId.values()].find((d) => d.url === a.getAttribute('href'));
      if (position > 0 && doc) trackResultClick(position, doc.type, s.strings.locale);
    },
    true,
  );
}

/** (Re)initialize the search island against the current DOM. Idempotent per `astro:page-load`. */
function init(): void {
  const root = document.getElementById('search');
  if (!root) return; // not the search page

  const strings = readStrings(root);
  const params = new URLSearchParams(location.search);
  const initialType = parseType(params.get('type'));
  const initialQ = params.get('q') ?? '';

  state = {
    root,
    strings,
    db: null,
    byId: new Map(),
    loading: null,
    type: initialType,
    debounce: null,
  };
  bind(state);

  // Reflect the initial filter on the pills immediately (counts fill once a query runs).
  inputEl(root).value = initialQ;
  paintFilters(root, initialQ.trim(), emptyCounts());

  // Deep link / shared search: a page that loads with `?q=` runs the search right away (which
  // eagerly downloads the index). Without `?q=` we stay lazy — nothing downloads until intent.
  if (initialQ.trim()) void query(state, initialQ);
}

// Bind on astro:page-load (first load + every View Transitions swap) so search survives navigation.
document.addEventListener('astro:page-load', init);
