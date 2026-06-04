import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import { ui } from '@/i18n/ui';

const COMPONENT = fileURLToPath(
  new URL('../../src/components/content/Reactions.astro', import.meta.url),
);

/**
 * Anonymous reactions (#201) — the server-rendered buttons on built blog posts. Reacting needs JS,
 * but the buttons + a reserved count box render at build (no CLS), the localized heading is correct
 * per locale, and no client storage is used.
 */

const EMOJI = ['👍', '🎉', '❤️', '🚀'];
const norm = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

describe('Reactions on built blog posts', () => {
  let posts: RenderedPage[];
  beforeAll(async () => {
    const pages = await collectLocalePages();
    posts = pages.filter((p) => /^\/blog\/[^/]+$/.test(p.logicalPath));
  });

  it('renders the reaction region with the full emoji palette + a reserved count box', () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      const doc = parseHTML(p.html).document;
      const region = doc.querySelector('[data-reactions]:not([data-compact])');
      expect(region, p.relPath).not.toBeNull();
      // the post's own locale path is the write target
      expect(norm(region!.getAttribute('data-reactions-path') ?? ''), p.relPath).toBe(
        `/${p.locale}${p.logicalPath}`,
      );
      const buttons = [...region!.querySelectorAll('[data-reaction-emoji]')];
      expect(
        buttons.map((b) => b.getAttribute('data-reaction-emoji')),
        p.relPath,
      ).toEqual(EMOJI);
      // every button reserves a count slot (no CLS when the island fills it)
      for (const b of buttons) {
        expect(b.querySelector('[data-reaction-count]'), p.relPath).not.toBeNull();
      }
    }
  });

  it('uses the per-locale heading and bakes no count number at build', () => {
    for (const p of posts) {
      const doc = parseHTML(p.html).document;
      const region = doc.querySelector('[data-reactions]:not([data-compact])')!;
      expect(region.textContent, p.relPath).toContain(ui[p.locale]['blog.reactions.heading']);
      // counts come from the GET at runtime — nothing numeric is server-rendered into the count spans.
      for (const span of region.querySelectorAll('[data-reaction-count]')) {
        expect((span.textContent ?? '').trim(), p.relPath).toBe('');
      }
    }
  });

  it('wires every post to /api/react', () => {
    for (const p of posts) expect(p.html, p.relPath).toContain('/api/react');
  });

  it('the island uses no cookies or client storage (server-side dedup handles uniqueness)', async () => {
    const src = (await readFile(COMPONENT, 'utf8')).toLowerCase();
    expect(src).not.toContain('document.cookie');
    expect(src).not.toContain('localstorage');
    expect(src).not.toContain('sessionstorage');
  });
});
