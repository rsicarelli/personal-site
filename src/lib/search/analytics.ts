/**
 * Search analytics (Umami, cookieless) — client-side helpers for the engine islands. Event names
 * and prop shapes are the cross-engine contract so dashboards line up regardless of which PR wins:
 *
 *  - `search`              { q_len_bucket, results_bucket, type, locale } — NO raw query (privacy).
 *  - `search-zero`         { q, type, locale } — raw normalized query ONLY on zero results: low
 *                          volume, and the content-gap signal is the whole point of the event.
 *  - `search-result-click` { position, type, locale } — 1-based rank of the clicked result.
 *
 * The server-rendered engine (D1 FTS5) ships no client JS, so it counts searches server-side in
 * D1 instead (see functions/) — these helpers are for the client-side engines only.
 */

import type { Locale } from '@/config/site';
import type { SearchType } from './types';

declare global {
  interface Window {
    umami?: { track: (event?: string, data?: Record<string, unknown>) => void };
  }
}

type TypeFilter = SearchType | 'all';

function bucket(value: number, edges: [number, string][], top: string): string {
  for (const [max, label] of edges) if (value <= max) return label;
  return top;
}

export function qLenBucket(q: string): string {
  return bucket(
    q.length,
    [
      [3, '1-3'],
      [10, '4-10'],
      [20, '11-20'],
    ],
    '20+',
  );
}

export function resultsBucket(n: number): string {
  return bucket(
    n,
    [
      [0, '0'],
      [5, '1-5'],
      [20, '6-20'],
    ],
    '20+',
  );
}

export function trackSearch(q: string, results: number, type: TypeFilter, locale: Locale): void {
  window.umami?.track('search', {
    q_len_bucket: qLenBucket(q),
    results_bucket: resultsBucket(results),
    type,
    locale,
  });
  if (results === 0) {
    window.umami?.track('search-zero', { q: q.trim().toLowerCase(), type, locale });
  }
}

export function trackResultClick(position: number, type: SearchType, locale: Locale): void {
  window.umami?.track('search-result-click', { position, type, locale });
}
