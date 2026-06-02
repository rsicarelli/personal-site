import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';

/**
 * E-E-A-T wiring (#59). Verifies the entity-reconciliation `sameAs` set flows from the CV into the
 * About page's Person JSON-LD and its visible "Elsewhere" links, and that blog posts carry a
 * visible author byline linking to /about (pairing with the BlogPosting.author ref from #52).
 */

const EXPECTED_SAME_AS = [
  'https://github.com/rsicarelli',
  'https://linkedin.com/in/rsicarelli',
  'https://x.com/rsicarelli',
  'https://sessionize.com/rodrigo-sicarelli',
  'https://www.stone.com.br',
];

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
});

/** The Person node from a page's JSON-LD @graph, if present. */
function personNode(html: string): Record<string, unknown> | undefined {
  for (const s of parseHTML(html).document.querySelectorAll('script[type="application/ld+json"]')) {
    const doc = JSON.parse(s.textContent ?? '');
    const node = (doc['@graph'] ?? [doc]).find(
      (n: Record<string, unknown>) => n['@type'] === 'Person',
    );
    if (node) return node;
  }
  return undefined;
}

describe('About page Person identity', () => {
  it('emits the full sameAs reconciliation set in both locales', () => {
    const abouts = pages.filter((p) => p.logicalPath === '/about');
    expect(abouts.length).toBe(2);
    for (const p of abouts) {
      const person = personNode(p.html);
      expect(person, `${p.relPath}: no Person node`).toBeTruthy();
      expect(person!.sameAs).toEqual(EXPECTED_SAME_AS);
    }
  });

  it('renders the profiles as visible rel="me" links', () => {
    const about = pages.find((p) => p.logicalPath === '/about')!;
    const doc = parseHTML(about.html).document;
    const meHrefs = [...doc.querySelectorAll('a[rel~="me"]')].map((a) => a.getAttribute('href'));
    for (const url of EXPECTED_SAME_AS) {
      expect(meHrefs, `missing rel=me link ${url}`).toContain(url);
    }
  });
});

describe('blog byline', () => {
  it('every post links the author byline to /about', () => {
    const posts = pages.filter((p) => /^\/blog\/[^/]+$/.test(p.logicalPath));
    expect(posts.length, 'no blog posts rendered').toBeGreaterThan(0);
    for (const p of posts) {
      const doc = parseHTML(p.html).document;
      const byline = doc.querySelector(`a[href="/${p.locale}/about"][rel~="author"]`);
      expect(byline, `${p.relPath}: missing author byline`).toBeTruthy();
      expect(byline!.textContent?.trim()).toBe('Rodrigo Sicarelli');
    }
  });
});
