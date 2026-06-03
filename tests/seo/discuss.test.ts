import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import { ui } from '@/i18n/ui';
import { discussLinks } from '@/lib/discuss';

/**
 * PostDiscuss (#196) — off-site "Discuss on…" links + an always-present "Reply via email".
 */

describe('discussLinks() builder', () => {
  it('returns [] when no discuss object is provided', () => {
    expect(discussLinks()).toEqual([]);
    expect(discussLinks({})).toEqual([]);
  });

  it('keeps a fixed order (hn → reddit → lobsters → mastodon) regardless of input', () => {
    const links = discussLinks({
      mastodon: 'https://m.example/1',
      hn: 'https://news.ycombinator.com/item?id=1',
    });
    expect(links.map((l) => l.id)).toEqual(['hn', 'mastodon']);
  });

  it('passes the hrefs through and carries a brand name + label key', () => {
    const links = discussLinks({ reddit: 'https://reddit.com/r/kotlin/x' });
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      id: 'reddit',
      href: 'https://reddit.com/r/kotlin/x',
      name: 'Reddit',
      labelKey: 'blog.discuss.reddit',
    });
  });
});

describe('PostDiscuss rendered on built blog posts', () => {
  let posts: RenderedPage[];
  beforeAll(async () => {
    const pages = await collectLocalePages();
    posts = pages.filter((p) => /^\/blog\/[^/]+$/.test(p.logicalPath));
  });

  it('renders a "Reply via email" mailto (to the public address) on every post, both locales', () => {
    expect(posts.length).toBeGreaterThan(0);
    expect(new Set(posts.map((p) => p.locale))).toEqual(new Set(['en', 'pt-br']));
    for (const p of posts) {
      const doc = parseHTML(p.html).document;
      // ShareButtons also has a mailto (recipient-less); target ours by the public address.
      const reply = doc.querySelector('a[href^="mailto:hello@rsicarelli.com"]');
      expect(reply, p.relPath).toBeTruthy();
      expect(reply!.getAttribute('href')!, p.relPath).toContain('subject=');
      expect(reply!.textContent ?? '', p.relPath).toContain(ui[p.locale]['blog.discuss.reply']);
      // localized section label present per locale
      expect(p.html, p.relPath).toContain(ui[p.locale]['blog.discuss.label']);
    }
  });
});
