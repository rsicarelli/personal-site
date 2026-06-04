import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';
import { ui } from '@/i18n/ui';
import { shareTargets } from '@/lib/share';

/**
 * ShareButtons (#194) — trackerless, cookieless, no share counts.
 *
 * Two layers: a pure unit test of the URL builder (`shareTargets`) and a rendered-output test that
 * asserts the buttons are present and correct on the actually-built blog posts in BOTH locales.
 */

describe('shareTargets() URL builder', () => {
  const url = 'https://rsicarelli.com/en/blog/hello-world';
  const title = 'Tom & Jerry: a "tale" of café résumé';
  const targets = shareTargets(url, title);
  const byId = Object.fromEntries(targets.map((t) => [t.id, t]));

  it('returns the four expected targets in order', () => {
    expect(targets.map((t) => t.id)).toEqual(['twitter', 'bluesky', 'linkedin', 'email']);
  });

  it('percent-encodes the title and url (no raw spaces, quotes or ampersands in the query)', () => {
    for (const t of targets) {
      const query = t.href.slice(t.href.indexOf('?') + 1); // skip scheme/host
      expect(query, t.id).not.toMatch(/[ "<>]/);
      // the only literal `&` allowed is the param separator (twitter's text&url)
      expect(query.replace(/&(?=\w+=)/g, ''), t.id).not.toContain('&');
    }
  });

  it('twitter intent carries both text and the url param', () => {
    expect(byId.twitter.href).toMatch(/^https:\/\/twitter\.com\/intent\/tweet\?text=/);
    expect(byId.twitter.href).toContain(`&url=${encodeURIComponent(url)}`);
  });

  it('bluesky uses the compose intent with title + url in the text', () => {
    expect(byId.bluesky.href).toBe(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`,
    );
  });

  it('linkedin uses share-offsite with the encoded url', () => {
    expect(byId.linkedin.href).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    );
  });

  it('email is a mailto: with subject and a body containing the url', () => {
    expect(byId.email.href).toMatch(/^mailto:\?subject=/);
    expect(byId.email.href).toContain(`subject=${encodeURIComponent(title)}`);
    expect(byId.email.href).toContain(encodeURIComponent(url));
    expect(byId.email.href).not.toMatch(/^https?:/);
  });

  it('emits no follower/share counts (helper exposes only links)', () => {
    for (const t of targets) {
      expect(Object.keys(t)).toEqual(['id', 'labelKey', 'href']);
    }
  });
});

describe('ShareButtons rendered on built blog posts', () => {
  let posts: RenderedPage[];

  beforeAll(async () => {
    const pages = await collectLocalePages();
    // Post detail pages only: exactly one segment after /blog/ (excludes /blog and /blog/tags/*).
    posts = pages.filter((p) => /^\/blog\/(?!\d+$)[^/]+$/.test(p.logicalPath));
  });

  const region = (html: string) =>
    parseHTML(html).document.querySelector('[data-share]:not([data-compact])');

  it('renders a share region on blog posts in both locales', () => {
    expect(posts.length).toBeGreaterThan(0);
    expect(new Set(posts.map((p) => p.locale))).toEqual(new Set(['en', 'pt-br']));
    for (const p of posts) {
      expect(region(p.html), p.relPath).not.toBeNull();
    }
  });

  it('ships the four static intent links (zero-JS baseline) on every post', () => {
    for (const p of posts) {
      const hrefs = [...region(p.html)!.querySelectorAll('a')].map((a) => a.getAttribute('href')!);
      expect(
        hrefs.some((h) => h.startsWith('https://twitter.com/intent/tweet')),
        p.relPath,
      ).toBe(true);
      expect(
        hrefs.some((h) => h.startsWith('https://bsky.app/intent/compose')),
        p.relPath,
      ).toBe(true);
      expect(
        hrefs.some((h) => h.startsWith('https://www.linkedin.com/sharing/share-offsite/')),
        p.relPath,
      ).toBe(true);
      expect(
        hrefs.some((h) => h.startsWith('mailto:')),
        p.relPath,
      ).toBe(true);
    }
  });

  it('opens external intent links safely (target=_blank + rel noopener), but not the mailto', () => {
    for (const p of posts) {
      for (const a of region(p.html)!.querySelectorAll('a')) {
        const href = a.getAttribute('href')!;
        if (href.startsWith('mailto:')) {
          expect(a.getAttribute('target'), p.relPath).toBeNull();
          continue;
        }
        expect(a.getAttribute('target'), p.relPath).toBe('_blank');
        expect(a.getAttribute('rel') ?? '', `${p.relPath} ${href}`).toContain('noopener');
      }
    }
  });

  it('shares the post’s own canonical URL (matches the page <link rel="canonical">)', () => {
    for (const p of posts) {
      const doc = parseHTML(p.html).document;
      const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
      expect(canonical, p.relPath).toContain(`/${p.locale}/blog/`);
      const twitter = [...region(p.html)!.querySelectorAll('a')]
        .map((a) => a.getAttribute('href')!)
        .find((h) => h.startsWith('https://twitter.com/intent/tweet'))!;
      const shared = new URL(twitter).searchParams.get('url') ?? '';
      expect(shared, p.relPath).toBe(canonical);
    }
  });

  it('shows the localized share label per locale', () => {
    for (const p of posts) {
      const label = ui[p.locale]['blog.share.label'];
      expect(region(p.html)!.textContent ?? '', p.relPath).toContain(label);
    }
  });

  it('renders no share counts', () => {
    for (const p of posts) {
      const text = (region(p.html)!.textContent ?? '').toLowerCase();
      expect(text, p.relPath).not.toMatch(/\d+\s*(shares?|likes?|views?)/);
    }
  });

  it('hides the JS-only Copy and native Share buttons by default (progressive enhancement)', () => {
    for (const p of posts) {
      const copy = region(p.html)!.querySelector('[data-share-copy]');
      const native = region(p.html)!.querySelector('[data-share-native]');
      expect(copy?.hasAttribute('hidden'), p.relPath).toBe(true);
      expect(native?.hasAttribute('hidden'), p.relPath).toBe(true);
    }
  });
});
