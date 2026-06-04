import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import { ui } from '@/i18n/ui';

/**
 * Blog post page UX redesign — the structural guarantees shared by all layout options: a labeled
 * TL;DR capsule (not a blockquote look-alike), an author card, and comments in the wide track.
 */

describe('Blog post layout', () => {
  let posts: RenderedPage[];
  beforeAll(async () => {
    const pages = await collectLocalePages();
    posts = pages.filter((p) => /^\/blog\/(?!\d+$)[^/]+$/.test(p.logicalPath));
  });

  it('renders an author card (about-the-author + a link to /about) on every post', () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      expect(p.html, p.relPath).toContain(ui[p.locale]['blog.aboutAuthor']);
      expect(p.html, p.relPath).toContain(`/${p.locale}/about`);
    }
  });

  it('renders the summary as a labeled capsule (an <aside>, not a blockquote)', () => {
    let seen = 0;
    for (const p of posts) {
      const capsule = parseHTML(p.html).document.querySelector('[data-post-summary]');
      if (!capsule) continue; // standalone posts may omit a summary
      seen++;
      expect(capsule.tagName.toLowerCase(), p.relPath).toBe('aside');
      expect(
        (capsule.textContent ?? '').includes(ui[p.locale]['blog.summaryLabel']),
        p.relPath,
      ).toBe(true);
    }
    expect(seen, 'expected at least one post with a summary capsule').toBeGreaterThan(0);
  });

  it('places the conversation/comments in the wide container, not the reading column', () => {
    for (const p of posts) {
      const wide = parseHTML(p.html).document.querySelector('.container-wide');
      expect(wide, p.relPath).not.toBeNull();
      // the always-on "join the conversation" channels live inside that wide track
      expect(
        (wide!.textContent ?? '').includes(ui[p.locale]['blog.discuss.label']),
        p.relPath,
      ).toBe(true);
    }
  });
});
