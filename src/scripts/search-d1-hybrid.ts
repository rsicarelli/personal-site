/**
 * Search instant island (Option D, Stage 1b) — the progressive-enhancement layer over the D1 FTS5
 * no-JS baseline. It is wired into the search shell as a PROCESSED `<script>` import, so Astro
 * bundles it to a hashed `/_astro/*` chunk served under `script-src 'self'` — NO new inline hash, NO
 * CSP change. It enhances IN PLACE on the SAME endpoint the no-JS form posts to:
 *
 *  - Debounce-fetches `/{locale}/search?q=…&type=…&format=json` (~140 ms) with an AbortController
 *    that cancels the in-flight request on each keystroke, and renders `#search-results` through the
 *    SAME `src/lib/search/markup.ts` the server uses — so client- and server-rendered results are
 *    byte-identical.
 *  - Deep-link hydration: when the page loads with `?q=` the server already SSR'd results, so the
 *    island just ATTACHES LISTENERS and leaves the initial DOM — it switches to fetch-mode only on
 *    the first interaction (no redundant initial fetch).
 *  - Typo correction (Stage 3): lazy-loads `/{locale}/search-terms.json` on first focus and corrects
 *    near-miss terms (`kotln` → `kotlin`) before fetching, surfacing an accessible "showing results
 *    for …" note.
 *  - Analytics (Umami, the enhanced path): `trackSearch` on SETTLE (≥800 ms after the last
 *    keystroke, and on submit) — NOT per keystroke — and `trackResultClick` via a capture-phase
 *    listener. The D1 counters stay the no-JS/committed signal (server-side).
 *
 * No-JS is unaffected: the `<form method="get">` and the filter `<a href>`s still hit the function's
 * HTML path when JS is off or before this script loads. Re-inits on `astro:page-load` (View
 * Transitions) with an idempotent guard. Every failure degrades gracefully — the form keeps working.
 */
import {
  renderResultItem,
  highlight,
  fillTemplate,
  termsOf,
  type RenderableDoc,
} from '@/lib/search/markup';
import { trackSearch, trackResultClick } from '@/lib/search/analytics';
import { correctQuery } from '@/lib/search/typo';
import type { Locale } from '@/config/site';
import type { SearchType } from '@/lib/search/types';

type TypeFilter = SearchType | 'all';

/** The JSON contract returned by the function's `?format=json` path (mirrors server.ts). */
interface SearchJsonResult {
  url: string;
  title: string;
  typeLabel: string;
  meta: { text: string; iso?: string }[];
  excerptHtml: string;
}
interface SearchJsonPayload {
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

const DEBOUNCE_MS = 140;
const SETTLE_MS = 800;

/** Localized template strings the island needs, read from `#search` data-* (no i18n import). */
interface Strings {
  count: string;
  countOne: string;
  empty: string;
  emptyHint: string;
  error: string;
  errorHint: string;
  loading: string;
  showingFor: string;
}

function enhance(root: HTMLElement): void {
  // Idempotent guard — re-running on astro:page-load must not double-bind.
  if (root.dataset.hybridEnhanced) return;
  root.dataset.hybridEnhanced = '1';

  const locale = (root.getAttribute('data-locale') ?? 'en') as Locale;
  const strings: Strings = {
    count: root.getAttribute('data-count') ?? '{n} results for “{q}”',
    countOne: root.getAttribute('data-count-one') ?? '{n} result for “{q}”',
    empty: root.getAttribute('data-empty') ?? 'No results for “{q}”',
    emptyHint: root.getAttribute('data-empty-hint') ?? '',
    error: root.getAttribute('data-error') ?? 'Search is temporarily unavailable.',
    errorHint: root.getAttribute('data-error-hint') ?? '',
    loading: root.getAttribute('data-loading') ?? 'Searching…',
    showingFor: root.getAttribute('data-showing-for') ?? 'Showing results for “{q}”',
  };

  const form = root.querySelector<HTMLFormElement>('#search-form');
  const input = root.querySelector<HTMLInputElement>('#search-q');
  const countEl = root.querySelector<HTMLElement>('#search-count');
  const resultsEl = root.querySelector<HTMLUListElement>('#search-results');
  const zeroEl = root.querySelector<HTMLElement>('#search-zero');
  const filters = root.querySelectorAll<HTMLAnchorElement>('#search-filters a[data-type]');
  if (!form || !input || !countEl || !resultsEl) return;

  let activeType: TypeFilter =
    ([...filters]
      .find((a) => a.getAttribute('aria-current') === 'true')
      ?.getAttribute('data-type') as TypeFilter | undefined) ?? 'all';

  // Deep-link hydration: the server already SSR'd the initial DOM for `?q=`, so the island attaches
  // listeners WITHOUT calling `run()` on load — no redundant initial fetch. It only switches to
  // fetch-mode on the first input/submit/filter interaction below.

  let controller: AbortController | null = null;
  let debounceTimer: number | undefined;
  let settleTimer: number | undefined;
  let dict: string[] | null = null;
  let dictRequested = false;

  // ---- Typo dictionary (lazy, first focus) -------------------------------------------------
  function loadDict(): void {
    if (dictRequested) return;
    dictRequested = true;
    fetch(`/${locale}/search-terms.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { terms?: string[] } | null) => {
        if (d && Array.isArray(d.terms)) dict = d.terms;
      })
      .catch(() => {
        /* dictionary is an enhancement; failure just disables typo correction */
      });
  }

  // ---- Rendering helpers -------------------------------------------------------------------
  // We never assign a string containing the user's query to `innerHTML` — the status line is set via
  // `textContent` + DOM nodes (so `q` can't reach an HTML sink, full stop), and result markup is
  // adopted as PARSED NODES from a detached <template>. The <template> source is the server's
  // already-escaped result HTML (from fetch JSON, not a DOM/location source), so there's no
  // DOM-text-to-HTML XSS path.

  /** Replace the count region with plain text (the localized count/empty/error/loading copy). */
  function setCountText(text: string): void {
    countEl!.replaceChildren(document.createTextNode(text));
  }

  /** Parse a trusted server-rendered HTML fragment into detached nodes (no live DOM sink). */
  function parseFragment(trustedHtml: string): DocumentFragment {
    const tpl = document.createElement('template');
    tpl.innerHTML = trustedHtml; // server-escaped result markup; not derived from input/location
    return tpl.content;
  }

  function renderResults(payload: SearchJsonPayload): void {
    const terms = payload.terms;
    const html = payload.results
      .map((r) => {
        const doc: RenderableDoc = {
          url: r.url,
          title: r.title,
          excerpt: '',
          typeLabel: r.typeLabel,
          meta: r.meta,
        };
        // Title is re-highlighted from `terms`; the excerpt is the server's trusted snippet HTML.
        return renderResultItem(doc, terms, {
          titleHtml: highlight(r.title, terms),
          excerptHtml: r.excerptHtml,
        });
      })
      .join('');
    resultsEl!.replaceChildren(parseFragment(html));
  }

  function updateFilters(payload: SearchJsonPayload, q: string): void {
    filters.forEach((a) => {
      const type = (a.getAttribute('data-type') ?? 'all') as TypeFilter;
      // Set the href via the anchor's URL properties (fixed pathname + url-encoded search params),
      // never by concatenating the query into the `href` attribute — so CodeQL sees a same-origin
      // relative URL with no `javascript:`/`data:` scheme sink, and the query stays URL-encoded.
      a.pathname = `/${locale}/search`;
      const params = new URLSearchParams();
      params.set('q', q);
      if (type !== 'all') params.set('type', type);
      a.search = params.toString();
      if (type === activeType) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
      const span = a.querySelector<HTMLElement>('span[data-count]');
      if (span) {
        const n = type === 'all' ? payload.total : (payload.counts[type as SearchType] ?? 0);
        span.textContent = ` (${n})`;
      }
    });
  }

  /** Count / empty / "showing results for" copy in the aria-live region — built as DOM text nodes
   * (never `innerHTML`), so the reflected query can't reach an HTML sink. */
  function setStatus(payload: SearchJsonPayload, q: string, correctedFrom: string | null): void {
    if (!payload.hasResults) {
      setCountText(`${fillTemplate(strings.empty, { q })} ${strings.emptyHint}`);
      return;
    }
    const displayed =
      payload.activeType != null ? (payload.counts[payload.activeType] ?? 0) : payload.total;
    const template = displayed === 1 ? strings.countOne : strings.count;

    countEl!.replaceChildren(document.createTextNode(fillTemplate(template, { n: displayed, q })));
    if (correctedFrom) {
      // Accessible note that we silently searched the corrected term — a real element + textContent.
      const note = document.createElement('span');
      note.className = 'text-muted-foreground/70';
      note.textContent = ` ${fillTemplate(strings.showingFor, { q })}`;
      countEl!.append(note);
    }
  }

  // ---- Fetch / render cycle ----------------------------------------------------------------
  function run(rawQuery: string, { settle }: { settle: boolean }): void {
    const q0 = rawQuery.trim();
    if (termsOf(q0).length === 0) {
      // Below the usable-query floor — clear to the empty/zero state, no fetch.
      resultsEl!.replaceChildren();
      if (zeroEl) zeroEl.hidden = false;
      setCountText('');
      return;
    }

    // Typo correction (best-effort; only when the dict has loaded).
    let q = q0;
    let correctedFrom: string | null = null;
    if (dict && dict.length) {
      const { corrected, changed } = correctQuery(q0, dict);
      if (changed) {
        correctedFrom = q0;
        q = corrected;
      }
    }

    controller?.abort();
    controller = new AbortController();
    setCountText(strings.loading);

    const params = new URLSearchParams();
    params.set('q', q);
    if (activeType !== 'all') params.set('type', activeType);
    params.set('format', 'json');
    const fetchUrl = `/${locale}/search?${params.toString()}`;

    // Keep the address bar in sync with the ORIGINAL typed query (shareable; back-button works).
    syncUrl(q0);

    fetch(fetchUrl, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
      .then((r) => (r.ok ? (r.json() as Promise<SearchJsonPayload>) : Promise.reject()))
      .then((payload) => {
        if (payload.error) {
          showError();
          return;
        }
        renderResults(payload);
        if (zeroEl) zeroEl.hidden = payload.hasResults;
        updateFilters(payload, q0);
        setStatus(payload, q, correctedFrom);

        if (settle) {
          const displayed =
            payload.activeType != null ? (payload.counts[payload.activeType] ?? 0) : payload.total;
          trackSearch(q, displayed, activeType, locale);
        }
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') return; // superseded by a newer keystroke
        showError();
      });
  }

  function showError(): void {
    setCountText(`${strings.error} ${strings.errorHint}`);
    if (zeroEl) zeroEl.hidden = false; // keep suggestions visible; form still works
  }

  function syncUrl(q: string): void {
    const params = new URLSearchParams();
    params.set('q', q);
    if (activeType !== 'all') params.set('type', activeType);
    const next = `/${locale}/search?${params.toString()}`;
    history.replaceState(null, '', next);
  }

  // ---- Event wiring ------------------------------------------------------------------------
  input.addEventListener('focus', loadDict, { once: true });

  input.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    window.clearTimeout(settleTimer);
    debounceTimer = window.setTimeout(() => run(input.value, { settle: false }), DEBOUNCE_MS);
    // Settle: report to Umami once typing pauses (not per keystroke).
    settleTimer = window.setTimeout(() => run(input.value, { settle: true }), SETTLE_MS);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.clearTimeout(debounceTimer);
    window.clearTimeout(settleTimer);
    run(input.value, { settle: true });
  });

  filters.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      activeType = (a.getAttribute('data-type') ?? 'all') as TypeFilter;
      run(input.value, { settle: true });
    });
  });

  // Capture-phase result-click analytics (1-based rank; resolve the type from the result URL).
  resultsEl.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      const link = target?.closest('a');
      if (!link || !resultsEl.contains(link)) return;
      const items = [...resultsEl.querySelectorAll('li')];
      const li = link.closest('li');
      const position = li ? items.indexOf(li) + 1 : 0;
      if (position < 1) return;
      trackResultClick(position, typeFromUrl(link.getAttribute('href') ?? ''), locale);
    },
    true,
  );
}

/** Best-effort result type from a result URL (`/{locale}/blog/…` → `blog`), for click analytics. */
function typeFromUrl(href: string): SearchType {
  if (/\/blog\//.test(href)) return 'blog';
  if (/\/projects\//.test(href)) return 'project';
  if (/\/talks\//.test(href)) return 'talk';
  if (/\/materials/.test(href)) return 'material';
  return 'blog';
}

function init(): void {
  const root = document.getElementById('search');
  if (root) enhance(root);
}

// First load AND every View Transition swap (idempotent via the data-* guard).
document.addEventListener('astro:page-load', init);
