import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';

/**
 * Answer-first content template (#56). Verifies the published sample post renders its `summary`
 * capsule (the answer-first lede) and that the `<Faq>` component emits both a visible `<dl>` and
 * FAQPage JSON-LD — per locale.
 */

const POST_PATH = '/blog/kotlin-multiplatform-in-production';

const CAPSULE = {
  en: 'Kotlin Multiplatform is production-ready',
  'pt-br': 'Kotlin Multiplatform está pronto para produção',
} as const;

let posts: RenderedPage[];
beforeAll(async () => {
  posts = (await collectLocalePages()).filter((p) => p.logicalPath === POST_PATH);
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
  it('renders the summary lede on the post in both locales', () => {
    expect(posts.length).toBe(2);
    for (const p of posts) {
      expect(p.html, p.relPath).toContain(CAPSULE[p.locale]);
    }
  });
});

describe('FAQ component', () => {
  it('renders an accessible <dl> with question/answer pairs', () => {
    for (const p of posts) {
      const doc = parseHTML(p.html).document;
      const terms = doc.querySelectorAll('dl dt');
      const defs = doc.querySelectorAll('dl dd');
      expect(terms.length, `${p.relPath}: no FAQ <dt>`).toBeGreaterThan(0);
      expect(defs.length, p.relPath).toBe(terms.length);
    }
  });

  it('emits FAQPage JSON-LD whose questions match the rendered <dt> count', () => {
    for (const p of posts) {
      const node = faqNode(p.html);
      expect(node, `${p.relPath}: no FAQPage node`).toBeTruthy();
      const questions = node!.mainEntity as { '@type': string; acceptedAnswer: unknown }[];
      const dtCount = parseHTML(p.html).document.querySelectorAll('dl dt').length;
      expect(questions.length, p.relPath).toBe(dtCount);
      for (const q of questions) {
        expect(q['@type']).toBe('Question');
        expect(q.acceptedAnswer).toMatchObject({ '@type': 'Answer' });
      }
    }
  });
});
