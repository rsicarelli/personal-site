import { readFile, readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { ui } from '@/i18n/ui';
import { LOCALES, type Locale } from '@/config/site';

/** Built site root. Tests assert on the real `astro build` artifact (run `task test:i18n`). */
export const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));

export interface RenderedPage {
  /** Route locale derived from the first path segment. */
  locale: Locale;
  /** Locale-stripped logical path: `/` for the home, `/about`, … */
  logicalPath: string;
  /** Path relative to dist, posix-style (e.g. `en/about/index.html`). */
  relPath: string;
  html: string;
}

/**
 * Collect every localized HTML page from `dist/**` (directory-style `index.html`, per
 * `trailingSlash: 'ignore'`). The neutral gateway `dist/index.html` is excluded — it's
 * locale-neutral and covered by gateway.test.ts.
 */
export async function collectLocalePages(): Promise<RenderedPage[]> {
  const entries = await readdir(DIST, { recursive: true });
  const pages: RenderedPage[] = [];
  for (const entry of entries) {
    const relPath = entry.split(sep).join('/');
    if (!relPath.endsWith('/index.html')) continue; // skip root index.html (gateway) + non-html
    const segments = relPath.split('/').slice(0, -1); // drop trailing 'index.html'
    const [first, ...rest] = segments;
    if (!LOCALES.includes(first as Locale)) continue; // only locale-rooted routes
    pages.push({
      locale: first as Locale,
      logicalPath: '/' + rest.join('/'),
      relPath,
      html: await readFile(join(DIST, entry), 'utf8'),
    });
  }
  return pages.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

/** Read + parse a single dist file into a linkedom document. */
export async function loadDocument(relPath: string) {
  const html = await readFile(join(DIST, relPath), 'utf8');
  return parseHTML(html).document;
}

/**
 * Dictionary values that DIFFER across locales, grouped per locale — used as language fingerprints.
 * A value identical in both locales (e.g. `nav.blog` "Blog") carries no language signal and is
 * dropped. `minLength` filters out short labels (nav/footer chrome) that could appear as innocent
 * substrings inside the other locale's prose — leaving long, content-bearing strings safe for
 * anti-leak assertions.
 *
 * Taxonomy badge labels (`blog.topic.*`/`blog.difficulty.*`/`blog.type.*`) are also dropped: they're
 * chrome rendered from `ui[locale]` by construction, and several are common technical words
 * ("Intermediate", "Reference", "Android") that legitimately appear in the OTHER locale's prose — so
 * they make false-positive leak markers. (Per-locale badge correctness is asserted separately.)
 */
const NON_MARKER_KEY_PREFIXES = ['blog.topic.', 'blog.difficulty.', 'blog.type.'];

export function uniqueMarkers(minLength = 0): Record<Locale, string[]> {
  const out = { en: [] as string[], 'pt-br': [] as string[] } satisfies Record<Locale, string[]>;
  for (const key of Object.keys(ui.en) as (keyof (typeof ui)['en'])[]) {
    if (NON_MARKER_KEY_PREFIXES.some((p) => key.startsWith(p))) continue;
    const en = ui.en[key];
    const pt = ui['pt-br'][key];
    if (en === pt) continue;
    if (en.length >= minLength) out.en.push(en);
    if (pt.length >= minLength) out['pt-br'].push(pt);
  }
  return out;
}

/** Visible text of a page's main content region (the body slot), whitespace-normalized. */
export function mainText(html: string): string {
  const doc = parseHTML(html).document;
  return (doc.querySelector('#main-content')?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export { LOCALES, type Locale };
