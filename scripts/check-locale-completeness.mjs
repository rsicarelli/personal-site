#!/usr/bin/env node
/**
 * Locale-completeness guardrail (#24).
 *
 * Bilingual (pt-BR / English) is firm constraint #1: every content entry MUST exist in BOTH
 * locales or the site ships a half-translated page. Astro's Zod schemas validate one file at a
 * time and can't express "this slug needs a sibling in the other locale", so this set-level check
 * lives here instead — run locally via `task dod` and in CI via .github/workflows/i18n-completeness.yml.
 *
 * It scans src/content/**, groups files by `collection/slug`, reads the `.en` / `.pt` suffix from
 * the filename, and exits non-zero if any slug is missing a locale. It checks file SUFFIXES (`pt`,
 * the documented on-disk convention), never URL slugs (`pt-br`). Pure node:fs — no dependencies.
 */
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_ROOT = fileURLToPath(new URL('../src/content/', import.meta.url));

/** Required on-disk locale suffixes (NOT URL slugs — files are `*.pt.mdx`, the route is /pt-br/). */
const REQUIRED_LOCALES = ['en', 'pt'];

/** Only these are content entries; anything else under src/content (images, etc.) is ignored. */
const CONTENT_EXT = /\.(?:mdx?|ya?ml)$/;
/** `<slug>.<locale>.<ext>` — slug may contain dots or a `/` (page-bundle `slug/index.en.mdx`). */
const LOCALE_FILE = /^(?<slug>.+)\.(?<locale>en|pt)\.(?:mdx?|ya?ml)$/;

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const files = await walk(CONTENT_ROOT);

/** key: "collection/slug" → Set<locale suffix> */
const groups = new Map();
const malformed = [];

for (const file of files) {
  const rel = relative(CONTENT_ROOT, file).split(sep).join('/'); // posix-style for stable keys
  if (!CONTENT_EXT.test(rel)) continue; // skip co-located assets

  const [collection, ...rest] = rel.split('/');
  const base = rest.join('/');
  const match = base.match(LOCALE_FILE);
  if (!match) {
    malformed.push(rel);
    continue;
  }

  const key = `${collection}/${match.groups.slug}`;
  if (!groups.has(key)) groups.set(key, new Set());
  groups.get(key).add(match.groups.locale);
}

const missing = [];
for (const [key, locales] of [...groups].sort()) {
  for (const need of REQUIRED_LOCALES) {
    if (!locales.has(need)) missing.push(`✗ ${key} is missing locale ".${need}"`);
  }
}

const required = REQUIRED_LOCALES.map((l) => `.${l}`).join(' + ');
let failed = false;

if (malformed.length) {
  failed = true;
  console.error('Content files without a recognized .en/.pt locale suffix:');
  for (const m of malformed) console.error(`  • ${m}`);
}

if (missing.length) {
  failed = true;
  console.error(`\nLocale completeness FAILED — ${missing.length} missing translation(s):`);
  for (const m of missing) console.error(`  ${m}`);
  console.error(`\nEvery content entry must exist in both locales (${required}).`);
}

if (failed) process.exit(1);

console.log(
  `✓ Locale completeness OK — all ${groups.size} content entries exist in both locales (${required}).`,
);
