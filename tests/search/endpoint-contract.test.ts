import { describe, it, expect } from 'vitest';
import {
  matchExpr,
  snippetToSafeHtml,
  excerptHtmlFor,
  buildJsonPayload,
  errorJsonPayload,
  filterHref,
  denseCounts,
  wantsJson,
  isLocale,
  isType,
  type Row,
} from '@/lib/search/server';

/**
 * Endpoint contract (`src/lib/search/server.ts`) — the pure query-building + serialization core the
 * `GET /{locale}/search` Pages Function imports. These tests are the proof that NO untested logic
 * hides in the handler: the FTS5 MATCH can't break out of its quotes, the snippet dance can't be
 * forged into live markup, the JSON shape is exact, and the guards/href encoding hold.
 */

function row(over: Partial<Row> = {}): Row {
  return {
    id: 'blog:x',
    type: 'blog',
    url: '/en/blog/x',
    title: 'Title',
    excerpt: 'An excerpt about kotlin.',
    type_label: 'Posts',
    meta_json: '[{"text":"5 min read"}]',
    body_snip: '',
    ...over,
  };
}

describe('matchExpr', () => {
  it('quotes each prefix term and ANDs them with spaces', () => {
    expect(matchExpr('kotlin multiplatform')).toBe('"kotlin"* "multiplatform"*');
  });

  it('strips FTS5 metacharacters so a term cannot break out of its quotes', () => {
    // Quotes, parens, colon, star, caret, minus are all stripped before re-quoting.
    expect(matchExpr('foo" OR title:bar')).toBe('"foo"* "OR"* "titlebar"*');
    expect(matchExpr('a*b (c)')).toBe('"ab"*'); // `(c)` → `c` is 1 char after strip, dropped
  });

  it('returns empty for a query with no usable (≥2 char) term', () => {
    expect(matchExpr('a b c')).toBe('');
    expect(matchExpr('   ')).toBe('');
  });
});

describe('snippetToSafeHtml', () => {
  it('escapes content and restores ONLY our sentinels to <mark>', () => {
    const out = snippetToSafeHtml('intro SMARKkotlinEMARK tail');
    expect(out).toBe('intro <mark>kotlin</mark> tail');
  });

  it('cannot be forged into live markup by hostile snippet content', () => {
    // A body that itself contains `</mark><script>` must stay fully escaped.
    const out = snippetToSafeHtml('SMARKx</mark><script>alert(1)</script>EMARK');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    // Exactly one real <mark> open and one close (our sentinels), nothing else.
    expect(out.match(/<mark>/g)).toHaveLength(1);
    expect(out.match(/<\/mark>/g)).toHaveLength(1);
  });
});

describe('excerptHtmlFor', () => {
  it('highlights the stored excerpt when it contains a term', () => {
    const out = excerptHtmlFor(row(), ['kotlin']);
    expect(out).toContain('<mark>kotlin</mark>');
  });

  it('falls back to the sanitized body snippet when the excerpt has no match', () => {
    const out = excerptHtmlFor(row({ excerpt: 'nothing here', body_snip: 'deep SMARKhitEMARK' }), [
      'kotlin',
    ]);
    expect(out).toBe('deep <mark>hit</mark>');
  });
});

describe('filterHref', () => {
  it('URL-encodes the query and omits type for "all"', () => {
    expect(filterHref('en', 'all', 'c++ & co')).toBe('/en/search?q=c%2B%2B+%26+co');
  });

  it('carries an active type', () => {
    expect(filterHref('pt-br', 'blog', 'kotlin')).toBe('/pt-br/search?q=kotlin&type=blog');
  });
});

describe('guards', () => {
  it('isLocale only accepts en / pt-br', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('pt-br')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('isType only accepts the four facets', () => {
    for (const t of ['blog', 'project', 'talk', 'material']) expect(isType(t)).toBe(true);
    expect(isType('all')).toBe(false);
    expect(isType(null)).toBe(false);
  });
});

describe('wantsJson', () => {
  const u = (qs: string) => new URL(`https://x/en/search${qs}`);
  it('detects ?format=json', () => {
    expect(wantsJson(u('?q=a&format=json'), null)).toBe(true);
  });
  it('detects an Accept: application/json header', () => {
    expect(wantsJson(u('?q=a'), 'text/html, application/json')).toBe(true);
  });
  it('defaults to HTML', () => {
    expect(wantsJson(u('?q=a'), 'text/html')).toBe(false);
  });
});

describe('denseCounts', () => {
  it('fills every facet to 0 when missing', () => {
    expect(denseCounts({ blog: 3 })).toEqual({ blog: 3, project: 0, talk: 0, material: 0 });
  });
});

describe('buildJsonPayload', () => {
  it('produces the exact contract shape with results', () => {
    const payload = buildJsonPayload({
      rawQuery: 'kotlin',
      locale: 'en',
      activeType: null,
      rows: [row({ body_snip: 'deep SMARKkotlinEMARK window' })],
      counts: { blog: 1 },
      total: 1,
    });
    expect(Object.keys(payload).sort()).toEqual(
      ['activeType', 'counts', 'hasResults', 'locale', 'q', 'results', 'terms', 'total'].sort(),
    );
    expect(payload).toMatchObject({
      q: 'kotlin',
      locale: 'en',
      activeType: null,
      total: 1,
      counts: { blog: 1, project: 0, talk: 0, material: 0 },
      hasResults: true,
      terms: ['kotlin'],
    });
    expect(payload.results).toHaveLength(1);
    const r = payload.results[0];
    expect(Object.keys(r).sort()).toEqual(
      ['excerptHtml', 'meta', 'title', 'typeLabel', 'url'].sort(),
    );
    expect(r.excerptHtml).toContain('<mark>kotlin</mark>');
    expect(r.meta).toEqual([{ text: '5 min read' }]);
  });

  it('marks hasResults:false for an empty row set', () => {
    const payload = buildJsonPayload({
      rawQuery: 'zzz',
      locale: 'en',
      activeType: 'blog',
      rows: [],
      counts: {},
      total: 0,
    });
    expect(payload.hasResults).toBe(false);
    expect(payload.results).toEqual([]);
    expect(payload.error).toBeUndefined();
  });

  it('keeps XSS-hostile content escaped in the JSON strings', () => {
    const payload = buildJsonPayload({
      rawQuery: 'kotlin',
      locale: 'en',
      activeType: null,
      rows: [row({ excerpt: '<img src=x onerror=alert(1)>', body_snip: '' })],
      counts: { blog: 1 },
      total: 1,
    });
    const html = payload.results[0].excerptHtml;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('errorJsonPayload', () => {
  it('flags error:true with no results', () => {
    const payload = errorJsonPayload('kotlin', 'en', null);
    expect(payload.error).toBe(true);
    expect(payload.hasResults).toBe(false);
    expect(payload.results).toEqual([]);
    expect(payload.counts).toEqual({ blog: 0, project: 0, talk: 0, material: 0 });
  });
});
