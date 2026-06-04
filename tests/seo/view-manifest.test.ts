import { describe, it, expect, beforeAll } from 'vitest';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { collectLocalePages, DIST, type RenderedPage } from '../i18n/_helpers';

/**
 * View counting (#200) — the build-time allowlist manifest and the (invisible) per-post beacon.
 */

const norm = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

describe('/engagement/slugs.json allowlist manifest', () => {
  let paths: string[];
  beforeAll(async () => {
    const raw = await readFile(join(DIST, 'engagement', 'slugs.json'), 'utf8');
    paths = (JSON.parse(raw) as { paths: string[] }).paths;
  });

  it('lists blog posts in both locales and nothing else', () => {
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) expect(p, p).toMatch(/^\/(en|pt-br)\/blog\/[^/]+$/);
    expect(paths.some((p) => p.startsWith('/en/blog/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/pt-br/blog/'))).toBe(true);
  });
});

describe('ViewBeacon on built blog posts', () => {
  let posts: RenderedPage[];
  let manifest: Set<string>;
  beforeAll(async () => {
    const pages = await collectLocalePages();
    posts = pages.filter((p) => /^\/blog\/(?!\d+$)[^/]+$/.test(p.logicalPath));
    const raw = await readFile(join(DIST, 'engagement', 'slugs.json'), 'utf8');
    manifest = new Set((JSON.parse(raw) as { paths: string[] }).paths);
  });

  it('embeds a beacon whose path is an allowlisted post, and posts to /api/view', () => {
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      const el = parseHTML(p.html).document.querySelector('[data-view-path]');
      expect(el, p.relPath).not.toBeNull();
      const path = norm(el!.getAttribute('data-view-path') ?? '');
      expect(path, p.relPath).toBe(`/${p.locale}${p.logicalPath}`);
      expect(manifest.has(path), `${p.relPath}: ${path} not in manifest`).toBe(true);
      expect(p.html, p.relPath).toContain('/api/view');
    }
  });

  it('shows no visible view-count number', () => {
    for (const p of posts) {
      const el = parseHTML(p.html).document.querySelector('[data-view-path]');
      // The beacon holder is hidden and carries no text.
      expect(el!.hasAttribute('hidden'), p.relPath).toBe(true);
      expect((el!.textContent ?? '').trim(), p.relPath).toBe('');
    }
  });
});
