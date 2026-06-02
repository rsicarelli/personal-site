import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDocument, LOCALES, type Locale } from './_helpers';
import { contentSuffix } from '@/i18n/utils';

const SRC_PAGES = fileURLToPath(new URL('../../src/content/pages/', import.meta.url));

/** Pull `title:` out of an MDX frontmatter block without a YAML dependency. */
function frontmatterTitle(source: string): string {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const title = match?.[1].match(/^title:\s*(.+?)\s*$/m)?.[1] ?? '';
  return title.replace(/^['"]|['"]$/g, '');
}

describe('content provenance — /about renders the matching-locale source file', () => {
  it('the rendered <h1> is the same-locale title, never the other locale’s', async () => {
    const titles = {} as Record<Locale, string>;
    for (const locale of LOCALES) {
      const source = await readFile(join(SRC_PAGES, `about.${contentSuffix(locale)}.mdx`), 'utf8');
      titles[locale] = frontmatterTitle(source);
      expect(titles[locale], `about.${contentSuffix(locale)}.mdx title`).not.toBe('');
    }

    for (const locale of LOCALES) {
      const doc = await loadDocument(`${locale}/about/index.html`);
      const h1 = doc.querySelector('h1')?.textContent?.trim() ?? '';
      const other = LOCALES.find((l) => l !== locale)!;

      expect(h1, `${locale}/about <h1>`).toBe(titles[locale]);
      if (titles[other] !== titles[locale]) {
        expect(h1, `${locale}/about must not show the ${other} title`).not.toBe(titles[other]);
      }
    }
  });
});
