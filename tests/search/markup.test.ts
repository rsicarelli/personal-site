import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  highlight,
  fillTemplate,
  termsOf,
  renderResultItem,
  type RenderableDoc,
} from '@/lib/search/markup';

/**
 * Shared result-markup contract (`src/lib/search/markup.ts`) — the SINGLE source of result HTML for
 * BOTH the no-JS server path and the instant island, so they render byte-identically. These unit
 * tests pin the escaping/highlighting/templating behaviour the parity rests on, and assert the XSS
 * guarantee: no user-controlled `<` ever escapes unescaped from a title/excerpt/url/meta.
 */

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" class='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; class=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
});

describe('highlight', () => {
  it('wraps case-insensitive matches in <mark> and escapes the rest', () => {
    const out = highlight('Kotlin is great', ['kotlin']);
    expect(out).toBe('<mark>Kotlin</mark> is great');
  });

  it('folds diacritics so an unaccented term highlights an accented word', () => {
    // `funcao` (no cedilla) must highlight `função` (with one) without corrupting the original text.
    const out = highlight('Uma função pura', ['funcao']);
    expect(out).toBe('Uma <mark>função</mark> pura');
  });

  it('ignores terms shorter than 2 chars', () => {
    expect(highlight('a big cat', ['a'])).toBe('a big cat');
  });

  it('escapes HTML in the source text (no unescaped < from the title)', () => {
    const out = highlight('<script>alert(1)</script> kotlin', ['kotlin']);
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('<mark>kotlin</mark>');
  });

  it('escapes HTML even inside a highlighted match (term made of markup)', () => {
    const out = highlight('a <b> tag', ['<b>']);
    // Whatever gets marked is still escaped — no raw `<b>` survives.
    expect(out).not.toMatch(/<(?!\/?mark>)/);
    expect(out).toContain('&lt;b&gt;');
  });
});

describe('fillTemplate', () => {
  it('substitutes {n} and {q}', () => {
    expect(fillTemplate('{n} results for “{q}”', { n: 5, q: 'kotlin' })).toBe(
      '5 results for “kotlin”',
    );
  });

  it('drops a missing {n} to empty, keeps {q}', () => {
    expect(fillTemplate('No results for “{q}”', { q: 'xyz' })).toBe('No results for “xyz”');
  });
});

describe('termsOf', () => {
  it('keeps tokens ≥ 2 chars, splits on whitespace', () => {
    expect(termsOf('a kotlin multiplatform')).toEqual(['kotlin', 'multiplatform']);
  });

  it('caps at 8 terms', () => {
    const q = Array.from({ length: 12 }, (_, i) => `term${i}`).join(' ');
    expect(termsOf(q)).toHaveLength(8);
  });
});

describe('renderResultItem', () => {
  const doc: RenderableDoc = {
    url: '/en/blog/kotlin-multiplatform',
    title: 'Kotlin Multiplatform',
    excerpt: 'A practical guide to Kotlin Multiplatform.',
    typeLabel: 'Posts',
    meta: [{ text: '5 min read' }],
  };

  it('emits the expected wrapper classes, type badge, title link and <mark>', () => {
    const html = renderResultItem(doc, ['kotlin']);
    expect(html).toContain('<li class="border-border border-b pb-8 last:border-0">');
    expect(html).toContain('Posts');
    expect(html).toContain('href="/en/blog/kotlin-multiplatform"');
    expect(html).toContain('<mark>Kotlin</mark>');
  });

  it('injects a trusted excerptHtml override verbatim', () => {
    const trusted = 'deep …<mark>match</mark>… here';
    const html = renderResultItem(doc, ['kotlin'], { excerptHtml: trusted });
    expect(html).toContain(trusted);
  });

  it('escapes a malicious url/title/typeLabel/meta — no unescaped <', () => {
    const evil: RenderableDoc = {
      url: '"><script>alert(1)</script>',
      title: '<img src=x onerror=alert(1)>',
      excerpt: '<b>x</b>',
      typeLabel: '<i>t</i>',
      meta: [{ text: '<u>m</u>' }],
    };
    const html = renderResultItem(evil, []);
    // No injected tag survives as live markup — the `<` of every hostile value is escaped, so the
    // `onerror` handler is inert text inside `&lt;img …&gt;`, not an attribute.
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;script&gt;');
    // The href is the only attribute fed user content; its `"` is escaped so it can't break out.
    expect(html).toContain('href="&quot;&gt;&lt;script&gt;');
  });
});
