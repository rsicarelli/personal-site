#!/usr/bin/env node
/**
 * seed-reactions.mjs (#216) — backfill the anonymous-reaction counts (#201) with the dev.to like
 * counts captured at import time (`provenance.reactions`).
 *
 * The blog mirror recorded each post's dev.to reaction total in frontmatter. #201 replaced the static
 * "N reactions" badge with our own first-party reaction counts (D1 `reactions` table). This script
 * converts that historical dev.to total into OUR counts so a post doesn't launch at zero — mapping it
 * to a single emoji (default ❤️) per locale path. dev.to is only the seed source; once seeded, the
 * live counts are the single source of truth.
 *
 * It prints SQL to stdout (no network, no deps). The owner runs it once, after the D1 is live:
 *
 *   node scripts/seed-reactions.mjs                         # dry-run: print the INSERT statements
 *   node scripts/seed-reactions.mjs > /tmp/seed.sql
 *   npx wrangler d1 execute personal-site-engagement --remote --file=/tmp/seed.sql
 *   npx wrangler d1 execute personal-site-engagement-preview --remote --file=/tmp/seed.sql
 *
 * Idempotent + non-destructive: each row is `ON CONFLICT(slug, emoji) DO NOTHING`, so re-running is a
 * no-op and a seed never clobbers a real reader reaction (if a reader already reacted with the seed
 * emoji on a slug, the historical seed is simply skipped for that slug).
 *
 * Pure Node — no dependencies. Mirrors scripts/devto-canonical-writeback.mjs.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const REPO_ROOT = new URL('../', import.meta.url);
const BLOG_DIR = fileURLToPath(new URL('src/content/blog/', REPO_ROOT));

/** Default emoji the dev.to like count seeds into — must be one of the #201 palette (👍 🎉 ❤️ 🚀). */
export const SEED_EMOJI = '❤️';

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
 * Build the per-path dev.to reaction seed from the blog content (pure, offline, testable). Returns one
 * `{ path, count }` per locale file that carries a positive `provenance.reactions`. The path matches
 * the reaction key the Reactions component posts (`new URL(canonicalUrl(...)).pathname`):
 * `/<locale>/blog/<slug>`, no trailing slash. Per-locale by design — each locale page is its own
 * reaction bucket, so en and pt-br are seeded independently from their own file's count.
 */
export async function buildReactionSeed({ blogDir = BLOG_DIR } = {}) {
  const entries = await readdir(blogDir, { recursive: true });
  const rows = [];

  for (const entry of entries) {
    const rel = entry.split(/[\\/]/).join('/');
    const match = rel.match(LOCALE_FILE);
    if (!match?.groups) continue; // not a locale content file (e.g. a co-located image)

    const raw = await readFile(resolve(blogDir, entry), 'utf8');
    const fm = frontmatter(raw);
    // `provenance.reactions` is indented under `provenance:`; the top-level #201 `reactions:` opt-out
    // flag is a boolean with no leading space, so this digit-only, indented match never catches it.
    const m = fm.match(/^\s+reactions:\s*(\d+)\s*$/m);
    if (!m) continue;
    const count = Number(m[1]);
    if (count <= 0) continue;

    // slug: page-bundle dir (`<slug>/index.en.md` → `<slug>`) or flat (`<slug>.en.md` → `<slug>`).
    const slug = match.groups.slug.replace(/\/index$/, '');
    const locale = SUFFIX_TO_LOCALE[match.groups.suffix];
    rows.push({ path: `/${locale}/blog/${slug}`, count });
  }

  rows.sort((a, b) => a.path.localeCompare(b.path));
  return rows;
}

/** Render the seed rows as idempotent, non-destructive D1 SQL. */
export function toSeedSql(rows, emoji = SEED_EMOJI) {
  const esc = (s) => s.replace(/'/g, "''"); // SQL single-quote escaping
  const lines = rows.map(
    (r) =>
      `INSERT INTO reactions (slug, emoji, count) VALUES ('${esc(r.path)}', '${esc(emoji)}', ${r.count}) ON CONFLICT(slug, emoji) DO NOTHING;`,
  );
  return [
    `-- dev.to reaction seed (#216) — ${rows.length} rows → emoji ${emoji}. Idempotent (DO NOTHING).`,
    ...lines,
    '',
  ].join('\n');
}

// CLI: print the SQL (only when run directly, not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = await buildReactionSeed();
  process.stdout.write(toSeedSql(rows));
}
