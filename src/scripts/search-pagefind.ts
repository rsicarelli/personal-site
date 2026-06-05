/**
 * Site search island — Option A (Pagefind).
 *
 * The static shell (src/pages/[locale]/search/index.astro) ships the form, the aria-live count
 * region, an empty `<ul#search-results>` and the zero-query suggestions. This island enhances that
 * shell IN PLACE: it reads `?q=`/`&type=` on load, runs a client-side Pagefind query against the
 * build-time index in `/pagefind/`, renders results through the SHARED renderer (src/lib/search/
 * markup.ts — byte-identical markup across the three competing engines), and keeps the URL
 * shareable with `history.replaceState`. No navigation, no full-page reload.
 *
 * Why Pagefind:
 *  - The index is built once at deploy (astro-pagefind's post-build hook crawls `data-pagefind-body`
 *    regions) and split per `<html lang>`, so a query is locale-scoped for free — the `en` page
 *    loads only the `en` chunk, the `pt-BR` page only `pt-br`.
 *  - Loading is LAZY + on-demand: the WASM + index fragments are fetched only when the user actually
 *    searches (a `?q=` on load, or the first focus/keystroke), so a cold `/search` visit ships zero
 *    search bytes.
 *
 * Cost: Pagefind needs WebAssembly (`wasm-unsafe-eval`) and a blob worker (`worker-src blob:`) — both
 * added to the CSP. We deliberately do NOT grant `'unsafe-eval'`, so Safari (which lacks
 * `wasm-unsafe-eval`) can't init the WASM: that path is caught and degrades to the localized error +
 * the browse fallback (`#search-zero` stays visible) rather than a silent dead input.
 *
 * Re-init: the island binds idempotently and re-runs on `astro:page-load` so it survives ClientRouter
 * (View Transitions) DOM swaps.
 */
import { renderResultItem, fillTemplate, termsOf, type RenderableDoc } from '@/lib/search/markup';
import { trackSearch, trackResultClick } from '@/lib/search/analytics';
import { SEARCH_TYPES, type SearchType } from '@/lib/search/types';
import type { Locale } from '@/config/site';

type TypeFilter = SearchType | 'all';

/** The subset of Pagefind's untyped browser API (`/pagefind/pagefind.js`) this island uses. */
interface Pagefind {
  init: () => Promise<void>;
  search: (term: string, options?: PagefindSearchOptions) => Promise<PagefindSearchResults>;
  debouncedSearch: (
    term: string,
    options?: PagefindSearchOptions,
    debounceMs?: number,
  ) => Promise<PagefindSearchResults | null>;
}
interface PagefindSearchOptions {
  filters?: Record<string, string | string[]>;
}
interface PagefindSearchResults {
  results: PagefindResult[];
  /** Facet counts keyed by filter name → value → count, e.g. `{ type: { blog: 12, talk: 3 } }`. */
  filters: Record<string, Record<string, number>>;
}
interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}
interface PagefindResultData {
  url: string;
  /** Pre-highlighted snippet (contains trusted `<mark>` tags from Pagefind itself). */
  excerpt: string;
  meta: Record<string, string>;
}

const DEBOUNCE_MS = 200;

/** Build the localized meta line from the baked `data-pagefind-meta` fields, per content type. */
function metaFor(type: TypeFilter, meta: Record<string, string>): RenderableDoc['meta'] {
  const segs: RenderableDoc['meta'] = [];
  switch (type) {
    case 'blog':
      if (meta.dateLabel) segs.push({ text: meta.dateLabel, iso: meta.dateIso });
      if (meta.minRead) segs.push({ text: meta.minRead });
      if (meta.topicLabel) segs.push({ text: meta.topicLabel });
      break;
    case 'talk':
      if (meta.dateLabel) segs.push({ text: meta.dateLabel, iso: meta.dateIso });
      if (meta.location) segs.push({ text: meta.location });
      if (meta.kind) segs.push({ text: meta.kind });
      break;
    case 'project':
      // Up to three tech tokens, baked `·`-joined; re-split so each renders as its own segment.
      if (meta.tech) for (const part of meta.tech.split(' · ')) segs.push({ text: part });
      break;
    // `material` (and `all`) carry no meta line.
  }
  return segs;
}

/** The `type:` filter value Pagefind indexed lives on the result; derive it from the meta payload. */
function typeOf(meta: Record<string, string>, fallback: TypeFilter): SearchType {
  // We don't get the raw filter back per-result, but each doc only matches one `type` filter, so
  // when a type filter is active that IS the type; on an unfiltered search we infer from the meta
  // shape (talks carry `kind`, blog carries `topicLabel`/`minRead`, projects `tech`).
  if (fallback !== 'all') return fallback;
  if (meta.kind || meta.location) return 'talk';
  if (meta.minRead || meta.topicLabel) return 'blog';
  if (meta.tech) return 'project';
  return 'material';
}

function init(): void {
  const root = document.getElementById('search');
  if (!root) return; // not the search page

  const form = document.getElementById('search-form') as HTMLFormElement | null;
  const input = document.getElementById('search-q') as HTMLInputElement | null;
  const countEl = document.getElementById('search-count');
  const resultsEl = document.getElementById('search-results');
  const zeroEl = document.getElementById('search-zero');
  const filtersNav = document.getElementById('search-filters');
  if (!form || !input || !countEl || !resultsEl || !zeroEl || !filtersNav) return;

  const locale = (root.dataset.locale ?? 'en') as Locale;
  const tpl = {
    count: root.dataset.count ?? '',
    countOne: root.dataset.countOne ?? '',
    empty: root.dataset.empty ?? '',
    emptyHint: root.dataset.emptyHint ?? '',
    error: root.dataset.error ?? '',
    errorHint: root.dataset.errorHint ?? '',
    loading: root.dataset.loading ?? '',
  };

  const pills = [...filtersNav.querySelectorAll<HTMLAnchorElement>('a[data-type]')];
  const action = `/${locale}/search`;

  // Read the initial state from the URL (the no-JS form submits here, so a deep link must rehydrate).
  const params = new URLSearchParams(window.location.search);
  let activeType: TypeFilter = (params.get('type') as TypeFilter) || 'all';
  if (activeType !== 'all' && !SEARCH_TYPES.includes(activeType as SearchType)) activeType = 'all';
  input.value = params.get('q') ?? '';

  let pf: Pagefind | null = null;
  let loadPromise: Promise<Pagefind | null> | null = null;
  let failed = false;
  /** Monotonic token so a slow in-flight render can't overwrite a newer query's results. */
  let seq = 0;

  /** Lazy, single-flight import + init of the Pagefind browser bundle from the static index. */
  function load(): Promise<Pagefind | null> {
    if (pf) return Promise.resolve(pf);
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        // Pagefind's browser bundle only exists in the built output (`/pagefind/pagefind.js`),
        // never on the TS import graph — building the specifier from a variable keeps `astro check`
        // from trying (and failing) to resolve it, and `@vite-ignore` stops Vite from bundling it.
        const pagefindPath = '/pagefind/pagefind.js';
        const mod = (await import(/* @vite-ignore */ pagefindPath)) as unknown as Pagefind;
        await mod.init();
        pf = mod;
        return mod;
      } catch {
        // WASM blocked (Safari w/o wasm-unsafe-eval) or the index is missing — surface the error
        // state instead of a silently broken input, and keep the browse fallback in view.
        failed = true;
        return null;
      }
    })();
    return loadPromise;
  }

  function setCount(html: string): void {
    countEl!.textContent = html;
  }

  function showError(): void {
    setCount(`${tpl.error} ${tpl.errorHint}`.trim());
    resultsEl!.innerHTML = '';
    zeroEl!.hidden = false;
  }

  /** Sync the active pill (`aria-current`) + each pill's `(N)` count span + the shareable href. */
  function paintFilters(q: string, counts: Record<string, number> | null): void {
    for (const pill of pills) {
      const type = pill.dataset.type as TypeFilter;
      const active = type === activeType;
      if (active) pill.setAttribute('aria-current', 'true');
      else pill.removeAttribute('aria-current');

      const span = pill.querySelector<HTMLElement>('span[data-count]');
      if (span) {
        let n: number | null = null;
        if (counts) n = type === 'all' ? sum(counts) : (counts[type] ?? 0);
        span.textContent = n != null ? ` (${n})` : '';
      }

      // Keep the no-JS href shareable: carry the current query, swap the type.
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (type !== 'all') qs.set('type', type);
      const query = qs.toString();
      pill.href = query ? `${action}?${query}` : action;
    }
  }

  function sum(counts: Record<string, number>): number {
    return SEARCH_TYPES.reduce((n, t) => n + (counts[t] ?? 0), 0);
  }

  /** Mirror the current q+type into the address bar without adding a history entry. */
  function syncUrl(q: string): void {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (activeType !== 'all') qs.set('type', activeType);
    const query = qs.toString();
    history.replaceState(null, '', query ? `${action}?${query}` : action);
  }

  /** Reset to the zero-query state: empty results, browse fallback visible, count cleared. */
  function showZero(q: string): void {
    resultsEl!.innerHTML = '';
    zeroEl!.hidden = false;
    setCount('');
    paintFilters(q, null);
  }

  async function run(rawQ: string): Promise<void> {
    const q = rawQ.trim();
    syncUrl(q);

    if (!q) {
      showZero(q);
      return;
    }

    const engine = await load();
    if (!engine || failed) {
      showError();
      return;
    }

    const token = ++seq;
    setCount(tpl.loading);

    const options: PagefindSearchOptions =
      activeType === 'all' ? {} : { filters: { type: activeType } };
    const search = await engine.debouncedSearch(q, options, DEBOUNCE_MS);
    if (search === null || token !== seq) return; // superseded by a newer keystroke

    // Per-type pill counts: an UNFILTERED faceted search returns counts for every `type` value, so
    // the pills reflect the full result space regardless of the active filter. A failure here only
    // costs the count badges — null leaves the spans blank rather than aborting the search.
    let counts: Record<string, number> | null;
    try {
      const faceted = activeType === 'all' ? search : await engine.search(q, {});
      counts = faceted.filters?.type ?? {};
    } catch {
      counts = null;
    }
    if (token !== seq) return;
    paintFilters(q, counts);

    const terms = termsOf(q);
    const datas = await Promise.all(search.results.map((r) => r.data()));
    if (token !== seq) return; // a newer query landed while awaiting result data

    if (datas.length === 0) {
      resultsEl!.innerHTML = '';
      zeroEl!.hidden = false;
      setCount(`${fillTemplate(tpl.empty, { q })} ${tpl.emptyHint}`.trim());
      trackSearch(q, 0, activeType, locale);
      return;
    }

    const items: string[] = [];
    const positions: SearchType[] = [];
    for (const d of datas) {
      const type = typeOf(d.meta, activeType);
      positions.push(type);
      const doc: RenderableDoc = {
        url: d.url,
        title: d.meta.title ?? '',
        excerpt: d.meta.excerpt ?? '',
        typeLabel: d.meta.typeLabel ?? '',
        meta: metaFor(type, d.meta),
      };
      // Pagefind's `excerpt` is already highlighted with trusted <mark>s → pass it through the
      // excerptHtml override; the title is highlighted by the shared renderer from `terms`.
      items.push(renderResultItem(doc, terms, { excerptHtml: d.excerpt }));
    }

    resultsEl!.innerHTML = items.join('');
    zeroEl!.hidden = true;
    const n = datas.length;
    setCount(fillTemplate(n === 1 ? tpl.countOne : tpl.count, { n, q }));
    trackSearch(q, n, activeType, locale);

    // Result-click analytics (1-based rank). Bind once per render via delegation on the list.
    resultsEl!.querySelectorAll<HTMLAnchorElement>('h3 a[href]').forEach((a, i) => {
      a.addEventListener('click', () => trackResultClick(i + 1, positions[i], locale), {
        once: true,
      });
    });
  }

  // --- wire up the shell -----------------------------------------------------------------------

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // stay on the page; the island owns the results
    void run(input.value);
  });

  let inputTimer: number | undefined;
  input.addEventListener('input', () => {
    // debouncedSearch already debounces the engine call; this short timer just coalesces the
    // (cheap) state plumbing so we don't thrash on every keystroke.
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => void run(input.value), 0);
    void load(); // warm the WASM on first keystroke so the first result lands fast
  });

  // Warm the engine on first focus too (covers paste / IME without a keydown).
  input.addEventListener('focus', () => void load(), { once: true });

  filtersNav.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-type]');
    if (!link) return;
    e.preventDefault();
    activeType = link.dataset.type as TypeFilter;
    void run(input.value);
  });

  // Initial render: only touch Pagefind if the deep link already carries a query (otherwise the
  // page stays at zero bytes until the user engages).
  if (input.value.trim()) void run(input.value);
  else paintFilters('', null);
}

// Idempotent across ClientRouter swaps: re-init on every page-load, guard against double-binding by
// tracking the element we last wired (a fresh DOM node after a swap re-runs the wiring).
let bound: HTMLElement | null = null;
function boot(): void {
  const root = document.getElementById('search');
  if (root && root !== bound) {
    bound = root;
    init();
  }
}
boot();
document.addEventListener('astro:page-load', boot);
