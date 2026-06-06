import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';

/**
 * Answer-first content template (#56). Verifies the featured post renders its `summary` capsule
 * (the answer-first lede) per locale, and that wherever a `<Faq>` is used it emits BOTH a visible
 * `<dl>` and a matching FAQPage JSON-LD node. The FAQ check scans every rendered page (not a
 * pinned slug) so the guardrail holds for whichever posts adopt the component.
 */

const POST_PATH = '/blog/kmp-102-modularizacao-no-kmp';

const CAPSULE = {
  en: 'In the last article we dug into the quirks of code exported to Objective-C headers',
  'pt-br': 'No último artigo, entramos em detalhes e aprendemos sobre as peculiaridades',
} as const;

let pages: RenderedPage[];
let posts: RenderedPage[];
beforeAll(async () => {
  pages = await collectLocalePages();
  posts = pages.filter((p) => p.logicalPath === POST_PATH);
});

function faqNode(html: string): Record<string, unknown> | undefined {
  for (const s of parseHTML(html).document.querySelectorAll('script[type="application/ld+json"]')) {
    const doc = JSON.parse(s.textContent ?? '');
    const node = (doc['@graph'] ?? [doc]).find(
      (n: Record<string, unknown>) => n['@type'] === 'FAQPage',
    );
    if (node) return node;
  }
  return undefined;
}

describe('answer-first capsule', () => {
  it('renders the summary lede on the featured post in both locales', () => {
    expect(posts.length).toBe(2);
    for (const p of posts) {
      expect(p.html, p.relPath).toContain(CAPSULE[p.locale]);
    }
  });
});

describe('FAQ component', () => {
  it('every FAQPage node matches an accessible <dl> with the same question count', () => {
    for (const p of pages) {
      const node = faqNode(p.html);
      if (!node) continue; // page doesn't use <Faq> — nothing to guard
      const questions = node.mainEntity as { '@type': string; acceptedAnswer: unknown }[];
      const doc = parseHTML(p.html).document;
      const terms = doc.querySelectorAll('dl dt');
      const defs = doc.querySelectorAll('dl dd');
      expect(terms.length, `${p.relPath}: FAQPage without a rendered <dl>`).toBe(questions.length);
      expect(defs.length, p.relPath).toBe(terms.length);
      for (const q of questions) {
        expect(q['@type']).toBe('Question');
        expect(q.acceptedAnswer).toMatchObject({ '@type': 'Answer' });
      }
    }
  });
});
