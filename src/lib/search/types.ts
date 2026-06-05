/**
 * Search corpus contract — the shared document shape every engine (Pagefind / D1 FTS5 / Orama)
 * indexes and renders. One doc per searchable entry, locale-scoped, with display strings baked at
 * BUILD time (localized type label, formatted date, meta line) so client islands and the Pages
 * Function can render results without access to the i18n dictionary or `Intl` re-derivation.
 *
 * `body` is plain text (markdown stripped) and exists ONLY for indexing — renderers must use
 * `excerpt` (the answer-first `summary` ?? `description`), never dump `body` on the page.
 */

/** Searchable content types, in display order. URL param `type` uses these tokens (+ `all`). */
export const SEARCH_TYPES = ['blog', 'project', 'talk', 'material'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/** One segment of the result meta line; `iso` renders the text inside `<time datetime>`. */
export interface SearchDocMeta {
  text: string;
  iso?: string;
}

export interface SearchDoc {
  /** Stable id: `<type>:<slug>` (materials use the entry slug; they share one listing URL). */
  id: string;
  type: SearchType;
  /** Locale-prefixed absolute path, e.g. `/en/blog/kmp-101-part1`. */
  url: string;
  title: string;
  /** Display snippet fallback: blog `summary` ?? `description`; others `description`. */
  excerpt: string;
  /** Plain-text body for full-text indexing (never rendered). */
  body: string;
  /** Free-text facets (blog tags / project tech) — indexed, also shown for projects. */
  tags: string[];
  /** Localized content-type badge (`Posts` / `Projetos` / …) baked per locale. */
  typeLabel: string;
  /** Pre-localized meta-line segments (date, reading time, topic, location, …). */
  meta: SearchDocMeta[];
}
