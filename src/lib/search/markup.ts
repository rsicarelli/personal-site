/**
 * Shared result markup — the SINGLE source of the result-item HTML, so every engine renders
 * byte-identical results: client islands (Pagefind / Orama) call these in the browser, and the
 * D1 Pages Function imports them server-side. For that to work this module must stay
 * DEPENDENCY-FREE (no `astro:*`, no `@/` alias, no DOM/Node APIs) — plain string building only.
 *
 * Everything is HTML-escaped here; engines that already produce trusted highlighted HTML
 * (Pagefind excerpts, FTS5 `snippet()`) pass it via the `*Html` overrides instead.
 *
 * The classes mirror the talks index list item (src/pages/[locale]/talks/index.astro) — the
 * site's lightest listing pattern — so search results read as native to the design system.
 */

import type { SearchDocMeta } from './types';

/** The renderable subset of a `SearchDoc` — what the meta line and card need, minus index fields. */
export interface RenderableDoc {
  url: string;
  title: string;
  excerpt: string;
  typeLabel: string;
  meta: SearchDocMeta[];
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Fold case + combining diacritics while keeping a map back to the original indices, so
 * `funcao` can highlight `função` without corrupting the original string. NFD expands each
 * accented char into base + combining marks; we drop the marks and remember which original
 * char every folded char came from.
 */
function foldWithMap(s: string): { folded: string; map: number[] } {
  let folded = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    for (const ch of s[i].normalize('NFD')) {
      const code = ch.codePointAt(0)!;
      if (code >= 0x0300 && code <= 0x036f) continue; // combining mark — drop
      folded += ch.toLowerCase();
      map.push(i);
    }
  }
  return { folded, map };
}

/**
 * Escape `text` and wrap every (case- and diacritic-insensitive) occurrence of each term in
 * `<mark>`. Overlapping matches are merged; terms shorter than 2 chars are ignored.
 */
export function highlight(text: string, terms: string[]): string {
  const clean = terms.map((t) => t.trim()).filter((t) => t.length >= 2);
  if (clean.length === 0) return escapeHtml(text);

  const { folded, map } = foldWithMap(text);
  const ranges: [number, number][] = [];
  for (const term of clean) {
    const needle = foldWithMap(term).folded;
    if (!needle) continue;
    let from = 0;
    let at: number;
    while ((at = folded.indexOf(needle, from)) !== -1) {
      ranges.push([map[at], map[at + needle.length - 1] + 1]);
      from = at + needle.length;
    }
  }
  if (ranges.length === 0) return escapeHtml(text);

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r] as [number, number]);
  }

  let out = '';
  let cursor = 0;
  for (const [start, end] of merged) {
    out += escapeHtml(text.slice(cursor, start));
    out += `<mark>${escapeHtml(text.slice(start, end))}</mark>`;
    cursor = end;
  }
  return out + escapeHtml(text.slice(cursor));
}

/** `·`-separated meta line segments; a segment with `iso` renders as `<time datetime>`. */
function renderMeta(meta: SearchDocMeta[]): string {
  if (meta.length === 0) return '';
  const parts = meta.map((m) =>
    m.iso
      ? `<time datetime="${escapeHtml(m.iso)}">${escapeHtml(m.text)}</time>`
      : `<span>${escapeHtml(m.text)}</span>`,
  );
  const joined = parts.join('<span aria-hidden="true">·</span>');
  return `<p class="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">${joined}</p>`;
}

/**
 * One search result `<li>` — type badge eyebrow, title link, meta line, excerpt. `terms` drives
 * the `<mark>` highlighting; `titleHtml`/`excerptHtml` let an engine substitute its own TRUSTED
 * pre-highlighted HTML (e.g. an FTS5 `snippet()` window) while keeping the wrapper identical.
 */
export function renderResultItem(
  doc: RenderableDoc,
  terms: string[],
  overrides: { titleHtml?: string; excerptHtml?: string } = {},
): string {
  const title = overrides.titleHtml ?? highlight(doc.title, terms);
  const excerpt = overrides.excerptHtml ?? highlight(doc.excerpt, terms);
  return [
    '<li class="border-border border-b pb-8 last:border-0">',
    `<p class="mb-2"><span class="border-border text-muted-foreground rounded-full border px-2 py-0.5 font-mono text-[0.65rem] tracking-wide uppercase">${escapeHtml(doc.typeLabel)}</span></p>`,
    `<h3 class="text-xl font-semibold tracking-tight"><a href="${escapeHtml(doc.url)}" class="hover:text-primary transition-colors">${title}</a></h3>`,
    renderMeta(doc.meta),
    `<p class="text-muted-foreground mt-2 max-w-prose">${excerpt}</p>`,
    '</li>',
  ].join('');
}

/** Fill a `{n}`/`{q}`-templated i18n string (`search.results.count`, `search.empty.title`, …). */
export function fillTemplate(template: string, vars: { n?: number; q?: string }): string {
  return template
    .replaceAll('{n}', vars.n != null ? String(vars.n) : '')
    .replaceAll('{q}', vars.q ?? '');
}

/** Split a raw query into highlight/index terms (whitespace-separated, length ≥ 2, max 8). */
export function termsOf(q: string): string[] {
  return q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 8);
}
