import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from '../i18n/_helpers';

/**
 * llms.txt (#55). Asserts the generated file follows the llms.txt shape (H1 + blockquote summary +
 * link sections), lists both locales' content with absolute URLs, and surfaces the answer-first
 * capsule where present. "Cheap insurance" — generated from the content spine, not hand-maintained.
 */
describe('llms.txt', () => {
  let txt: string;
  beforeAll(async () => {
    txt = await readFile(join(DIST, 'llms.txt'), 'utf8');
  });

  it('opens with an H1 and a blockquote summary', () => {
    expect(txt).toMatch(/^# Rodrigo Sicarelli/);
    expect(txt).toMatch(/\n> .+/);
  });

  it('lists content sections for both locales', () => {
    expect(txt).toContain('— English');
    expect(txt).toContain('— Português');
  });

  it('links are absolute and locale-prefixed', () => {
    const links = [...txt.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((l) => l.startsWith('https://rsicarelli.com/'))).toBe(true);
    expect(links.some((l) => l.includes('/en/'))).toBe(true);
    expect(links.some((l) => l.includes('/pt-br/'))).toBe(true);
  });

  it('surfaces the published post with its answer-first capsule', () => {
    expect(txt).toContain('/en/blog/kotlin-multiplatform-in-production');
    expect(txt).toContain('Kotlin Multiplatform is production-ready');
  });
});
