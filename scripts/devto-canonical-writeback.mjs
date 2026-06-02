#!/usr/bin/env node
/**
 * devto-canonical-writeback.mjs (#151) — point dev.to's `canonical_url` at our copies.
 *
 * The blog mirror imported 49 dev.to articles in-house; each post is self-canonical to
 * rsicarelli.com. The dev.to originals still outrank us (DA ~90) unless THEY declare our URL as
 * canonical. This sets `canonical_url` on each dev.to article to its matching rsicarelli.com URL,
 * consolidating canonical authority here (dev.to becomes the syndicated copy). Bing's index — and
 * therefore ChatGPT search — benefits too.
 *
 * SAFE BY DEFAULT: dry-run unless `--apply`, because `--apply` mutates live dev.to articles.
 *
 *   node scripts/devto-canonical-writeback.mjs            # dry-run: print the 49 mappings (no network)
 *   SITE_URL=https://rsicarelli.com \
 *     DEV_TO_API_KEY=xxxx node scripts/devto-canonical-writeback.mjs --apply   # write to dev.to
 *
 * `--apply` is a POST-DEPLOY step (needs the live, final URLs → Hosting #60) and is idempotent:
 * it GETs each article and only PUTs when the canonical_url differs. `DEV_TO_API_KEY` is a
 * shell-only secret read from the environment — never committed, never logged.
 *
 * Pure Node (global fetch on Node >= 18) — no dependencies. Mirrors scripts/indexnow-submit.mjs.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const REPO_ROOT = new URL('../', import.meta.url);
const BLOG_DIR = fileURLToPath(new URL('src/content/blog/', REPO_ROOT));

/** `<slug>.<en|pt>.<ext>` — same shape the locale-completeness guardrail + lib/content.ts use. */
const LOCALE_FILE = /^(?<slug>.+)\.(?<suffix>en|pt)\.(?:mdx?|ya?ml)$/;
/** On-disk suffix → URL locale (inverse of i18n `contentSuffix`). */
const SUFFIX_TO_LOCALE = { en: 'en', pt: 'pt-br' };

/** Read the YAML frontmatter block (between the first pair of `---` fences) as a raw string. */
function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

/**
 * Build the `devtoId → canonical URL` map from the blog content (pure, offline, testable).
 * Only posts that carry a `provenance.devtoId` AND are real translations (`translated !== false`)
 * are included — placeholders share their sibling's id and are skipped; hand-authored posts have
 * no id. The URL form is byte-identical to `canonicalUrl()` in src/lib/seo.ts (no trailing slash),
 * so dev.to's canonical matches our self-canonical exactly.
 */
export async function buildCanonicalMap({
  blogDir = BLOG_DIR,
  origin = 'https://rsicarelli.com',
} = {}) {
  const base = origin.replace(/\/$/, '');
  const entries = await readdir(blogDir, { recursive: true });
  const map = new Map(); // devtoId -> { url, slug, locale, file }
  const conflicts = new Set();
  const warnings = [];
  let skippedNoId = 0;
  let skippedPlaceholder = 0;

  for (const entry of entries) {
    const rel = entry.split(/[\\/]/).join('/');
    // Match the bundle-relative path so the slug captures the page-bundle dir, then collapse the
    // trailing `/index` (so `<slug>/index.en.md` and a flat `<slug>.en.md` both yield `<slug>`).
    const match = rel.match(LOCALE_FILE);
    if (!match?.groups) continue; // not a locale content file (e.g. a co-located image)

    const raw = await readFile(resolve(blogDir, entry), 'utf8');
    const fm = frontmatter(raw);
    const idMatch = fm.match(/^\s+devtoId:\s*(\d+)\s*$/m);
    if (!idMatch) {
      skippedNoId++;
      continue; // hand-authored post — no dev.to original to update
    }
    if (/^translated:\s*false\s*$/m.test(fm)) {
      skippedPlaceholder++;
      continue; // original-language placeholder — its sibling carries the real translation
    }

    const devtoId = Number(idMatch[1]);
    // slug: page-bundle dir (`<slug>/index.en.md` → `<slug>`) or flat (`<slug>.en.md` → `<slug>`).
    const slug = match.groups.slug.replace(/\/index$/, '');
    const locale = SUFFIX_TO_LOCALE[match.groups.suffix];
    const url = `${base}/${locale}/blog/${slug}`;

    const prior = map.get(devtoId);
    if (prior) {
      if (prior.url !== url) {
        // One dev.to article = one language. Two real translations sharing a devtoId means an
        // authored translation kept the source id — drop `provenance`/`devtoId` from the translated
        // file (#143); the translation is not a dev.to article. We never guess which wins.
        conflicts.add(devtoId);
        warnings.push(
          `devtoId ${devtoId}: ${prior.file} (${prior.url}) vs ${rel} (${url}) — skipped.`,
        );
      }
      continue; // keep first-seen; never overwrite
    }
    map.set(devtoId, { url, slug, locale, file: rel });
  }

  for (const id of conflicts) map.delete(id); // never apply an ambiguous canonical
  return { map, warnings, conflicts, skippedNoId, skippedPlaceholder };
}

const DEVTO_API = 'https://dev.to/api';

async function getCanonical(id, key) {
  const res = await fetch(`${DEVTO_API}/articles/${id}`, { headers: { 'api-key': key } });
  if (!res.ok) throw new Error(`GET article ${id} → ${res.status} ${res.statusText}`);
  return (await res.json()).canonical_url ?? null;
}

async function putCanonical(id, url, key) {
  const res = await fetch(`${DEVTO_API}/articles/${id}`, {
    method: 'PUT',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ article: { canonical_url: url } }),
  });
  if (res.status === 429) throw Object.assign(new Error('rate limited'), { retryable: true });
  if (!res.ok) throw new Error(`PUT article ${id} → ${res.status} ${res.statusText}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const apply = process.argv.includes('--apply');
  const origin = (process.env.SITE_URL ?? process.env.PUBLIC_SITE_URL ?? 'https://rsicarelli.com')
    .trim()
    .replace(/\/$/, '');

  const { map, warnings, skippedNoId, skippedPlaceholder } = await buildCanonicalMap({ origin });
  for (const w of warnings) console.warn(`⚠️  ${w}`);
  console.log(
    `${map.size} dev.to article(s) → ${origin} ` +
      `(skipped ${skippedNoId} hand-authored, ${skippedPlaceholder} placeholder).`,
  );

  if (!apply) {
    for (const [id, { url }] of [...map].sort((a, b) => a[0] - b[0]))
      console.log(`  ${id} → ${url}`);
    console.log('\nDry run — pass --apply (with DEV_TO_API_KEY) to write to dev.to.');
    return;
  }

  const key = process.env.DEV_TO_API_KEY;
  if (!key) {
    console.error('DEV_TO_API_KEY is required for --apply (shell env var; never commit it).');
    process.exit(1);
  }

  let updated = 0;
  let already = 0;
  const failed = [];
  for (const [id, { url }] of map) {
    try {
      if ((await getCanonical(id, key)) === url) {
        already++;
      } else {
        // One retry on a rate-limit, then give up on this article.
        try {
          await putCanonical(id, url, key);
        } catch (e) {
          if (e.retryable) {
            await sleep(5000);
            await putCanonical(id, url, key);
          } else throw e;
        }
        updated++;
        console.log(`✓ ${id} → ${url}`);
      }
    } catch (e) {
      failed.push(`${id}: ${e.message}`);
      console.error(`✗ ${e.message}`);
    }
    await sleep(1500); // respect Forem rate limits
  }

  console.log(`\nDone — ${updated} updated, ${already} already correct, ${failed.length} failed.`);
  if (failed.length) process.exit(1);
}

// Only run the CLI when invoked directly — importing buildCanonicalMap (tests) must not POST.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
