/**
 * Tiny JS typo correction over a per-locale term dictionary (Stage 3 of the search hybrid).
 *
 * The no-JS D1 path deliberately omits typo tolerance (legitimate under the tiered-parity rule);
 * the instant island lazy-loads `/{locale}/search-terms.json` on first focus and, before fetching,
 * substitutes a near-miss term for its closest dictionary match (`kotln` → `kotlin`). This module
 * is the PURE, importable correction core — extracted from the island so it's unit-testable
 * headlessly. No DOM/Network here; the island owns the fetch + the accessible "showing results for"
 * note.
 *
 * Conservative on purpose: exact matches and legitimate prefixes are NEVER rewritten (typing
 * `kot` while reaching for `kotlin` must still prefix-match server-side, not get "corrected" to a
 * sibling term), and nonsense with no close neighbour returns the term unchanged. The edit-distance
 * bound is 1, widened to 2 for longer (≥5-char) terms where a second slip is plausible.
 */

/** Bounded Levenshtein: returns the true distance, or `max + 1` as soon as it provably exceeds
 * `max` (an early-out so a dictionary scan stays cheap). Case-insensitive callers fold first. */
export function boundedEditDistance(a: string, b: string, max: number): number {
  const la = a.length;
  const lb = b.length;
  // Length gap alone can exceed the bound — bail before allocating.
  if (Math.abs(la - lb) > max) return max + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    // If the best cell in this whole row already exceeds the bound, no later row can recover.
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/** Per-term distance bound: 1, or 2 once the term is long enough (≥5 chars) for a second slip. */
export function distanceBound(term: string): number {
  return term.length >= 5 ? 2 : 1;
}

/**
 * Correct a single lowercased term against a lowercased dictionary, or return it unchanged.
 *  - length < 2 → never correct (too little signal; matches `termsOf`'s floor).
 *  - exact dictionary hit → unchanged.
 *  - legitimate prefix of a dictionary term → unchanged (prefix search already handles it).
 *  - otherwise → the closest term within the bound (ties broken by shorter, then alphabetical);
 *    nonsense with no neighbour in range → unchanged.
 */
export function correctTerm(term: string, dict: readonly string[]): string {
  const t = term.toLowerCase();
  if (t.length < 2) return term;

  let best: string | null = null;
  let bestDist = Infinity;
  const bound = distanceBound(t);

  for (const entry of dict) {
    if (entry === t) return term; // exact — leave the original casing alone
    if (entry.startsWith(t)) return term; // legitimate prefix — server prefix-match handles it
    const d = boundedEditDistance(t, entry, bound);
    if (d > bound) continue;
    if (d < bestDist || (d === bestDist && best !== null && betterTie(entry, best))) {
      best = entry;
      bestDist = d;
    }
  }
  return best ?? term;
}

/** Tie-break two equidistant candidates: prefer the shorter, then lexicographically smaller. */
function betterTie(candidate: string, current: string): boolean {
  if (candidate.length !== current.length) return candidate.length < current.length;
  return candidate < current;
}

/**
 * Correct every whitespace term of a raw query and return `{ corrected, changed }`. The island
 * only surfaces the "showing results for" note (and rewrites the fetch query) when `changed`.
 * Preserves the original inter-term spacing shape by re-joining on single spaces (queries are
 * already whitespace-normalized by the time they reach search).
 */
export function correctQuery(
  query: string,
  dict: readonly string[],
): { corrected: string; changed: boolean } {
  if (dict.length === 0) return { corrected: query, changed: false };
  const parts = query.split(/\s+/).filter(Boolean);
  let changed = false;
  const out = parts.map((p) => {
    const c = correctTerm(p, dict);
    if (c !== p) changed = true;
    return c;
  });
  return { corrected: changed ? out.join(' ') : query, changed };
}

// ---------------------------------------------------------------------------------------------
// Dictionary derivation (shared by the build endpoint and tests) — unique high-signal tokens.
// ---------------------------------------------------------------------------------------------
/** Cap on dictionary size: titles + tags are small/high-signal, but keep the payload tiny. */
export const TERM_DICT_CAP = 600;

/**
 * Derive the per-locale term dictionary from corpus titles + tags: lowercase, split on
 * non-alphanumeric (Unicode-aware, so diacritics survive), keep tokens ≥ 3 chars, dedupe, cap.
 * Build-time only — no D1/`fts5vocab` round-trip; same vocabulary the index is built from.
 */
export function termsFromCorpus(
  docs: readonly { title: string; tags: readonly string[] }[],
): string[] {
  const seen = new Set<string>();
  for (const doc of docs) {
    const source = `${doc.title} ${doc.tags.join(' ')}`.toLowerCase();
    for (const token of source.split(/[^\p{L}\p{N}]+/u)) {
      if (token.length >= 3) seen.add(token);
    }
  }
  return [...seen].slice(0, TERM_DICT_CAP);
}
