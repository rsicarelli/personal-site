import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { collectLocalePages, type RenderedPage } from '../i18n/_helpers';

/**
 * Reading layer (#226) — long-form `.prose` is set in a self-hosted serif (Source Serif 4) at the
 * 18px editorial reading size, while UI (Inter) and code (JetBrains Mono) are untouched. These guards
 * encode the decision: the token + prose wiring (source), the self-hosted/pt-BR font config (source),
 * the head preload (source), and the rendered proof on real posts (dist) — title in the serif layer,
 * the serif `@font-face` shipped, and NO runtime font CDN.
 */
const read = (rel: string) => readFileSync(new URL(`../../${rel}`, import.meta.url), 'utf8');

describe('Reading layer — serif long-form typography (#226)', () => {
  it('registers --font-serif and applies it to .prose at the 18px reading size', () => {
    const css = read('src/styles/global.css');
    expect(css).toMatch(/--font-serif:\s*var\(--font-source-serif\)/);
    const prose = css.slice(css.indexOf('.prose {'));
    expect(prose).toContain('font-family: var(--font-serif)');
    expect(prose).toContain('font-size: 1.125rem');
  });

  it('configures Source Serif 4 self-hosted with pt-BR coverage (latin + latin-ext)', () => {
    const cfg = read('astro.config.mjs');
    expect(cfg).toContain("name: 'Source Serif 4'");
    expect(cfg).toContain("cssVariable: '--font-source-serif'");
    expect(cfg).toContain('fontProviders.google()'); // downloaded + self-hosted at build, no runtime CDN
    const serif = cfg.slice(cfg.indexOf("name: 'Source Serif 4'"));
    expect(serif).toMatch(/subsets:\s*\[\s*'latin',\s*'latin-ext'\s*\]/);
  });

  it('preloads the serif reading face in the document head', () => {
    const layout = read('src/layouts/BaseLayout.astro');
    expect(layout).toMatch(/cssVariable="--font-source-serif"\s+preload=/);
  });

  describe('rendered posts', () => {
    let posts: RenderedPage[];
    beforeAll(async () => {
      const pages = await collectLocalePages();
      posts = pages.filter((p) => /^\/blog\/[^/]+$/.test(p.logicalPath));
    });

    it('renders the post title in the serif layer and self-hosts the face (no font CDN)', () => {
      expect(posts.length).toBeGreaterThan(0);
      for (const p of posts) {
        const h1 = parseHTML(p.html).document.querySelector('article h1');
        expect(h1, p.relPath).not.toBeNull();
        expect(h1!.getAttribute('class') ?? '', p.relPath).toContain('font-serif');
        // Self-hosted: the serif @font-face ships with its `src` pointing at our own /_astro/fonts
        // bundle — a positive proof of self-hosting (no runtime font CDN), and not a fragile
        // host-substring check.
        expect(p.html, p.relPath).toMatch(
          /@font-face\{font-family:"Source Serif 4[^}]*src:url\("\/_astro\/fonts\//,
        );
      }
    });
  });
});
