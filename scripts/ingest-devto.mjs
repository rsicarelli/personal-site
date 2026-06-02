#!/usr/bin/env node
/**
 * ingest-devto.mjs — Stage 2 of the dev.to mirror. Turns the raw export produced by
 * `devto-export.mjs` (in the sibling `personal-site-devto-export` worktree) into committed,
 * schema-valid Astro content: page-bundle blog posts + per-locale series metadata.
 *
 * It does the body cleanup the exporter intentionally left undone (strip the inline TOC, the
 * cross-language line, and the 🌱/🔗/⬅️/➡️ header nav — capturing the GitHub repo + branch links
 * into frontmatter first), maps dev.to metadata into the blog/series Zod schemas, and emits BOTH
 * locales per post so the locale-completeness guardrail passes. When a source language is missing,
 * the other-locale file carries the ORIGINAL body + `translated: false` (a "shown in original
 * language" placeholder the site banners and we track for translation).
 *
 * USAGE:
 *   node scripts/ingest-devto.mjs
 *   node scripts/ingest-devto.mjs --source ../personal-site-devto-export/migration/devto
 *
 * OUTPUT (idempotent — overwrites the same paths; does NOT touch hand-authored posts):
 *   src/content/blog/<clean-slug>/index.en.md
 *   src/content/blog/<clean-slug>/index.pt.md
 *   src/content/series/<slug>.en.yaml  +  <slug>.pt.yaml
 * Prints a summary and a paste-ready "pending translations" checklist for the tracking issue.
 */

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const argSource = (() => {
  const i = process.argv.indexOf('--source');
  return i >= 0 ? process.argv[i + 1] : '../personal-site-devto-export/migration/devto';
})();
const SOURCE = resolve(REPO_ROOT, argSource);
const BLOG_OUT = join(REPO_ROOT, 'src/content/blog');
const SERIES_OUT = join(REPO_ROOT, 'src/content/series');
const GH_USER = 'rsicarelli';

/** Spotlight ordering (lower = earlier). Flagship/newest first; unknown series sort last. */
const SERIES_ORDER = {
  'claude-code-101': 1,
  'kmp-101': 2,
  'kmp-102': 3,
  'android-plataforma': 4,
  'kotlin-koans-br': 5,
};

/** URL locale → on-disk file suffix (mirrors src/i18n/utils.ts `contentSuffix`). */
const SUFFIX = { en: 'en', 'pt-br': 'pt' };
const URL_LOCALES = ['en', 'pt-br'];

// ───────────────────────────── helpers ─────────────────────────────

/** Strip dev.to's trailing random token (`…-3p83`) for a clean URL slug; keep it if ambiguous. */
function cleanSlug(slug) {
  const m = slug.match(/-([a-z0-9]{3,8})$/i);
  // Only strip when the trailing segment looks like a generated id (contains a digit).
  return m && /[0-9]/.test(m[1]) ? slug.slice(0, -m[0].length) : slug;
}

/** ISO timestamp → date-only `YYYY-MM-DD` (project convention: content dates are date-only/UTC). */
const dateOnly = (iso) => (iso ? String(iso).slice(0, 10) : undefined);

/** A YAML scalar: numbers bare, everything else JSON-double-quoted (valid YAML, safely escaped). */
const scalar = (v) => (typeof v === 'number' ? String(v) : JSON.stringify(String(v)));

const ghRepoUrl = (repo) => (repo ? `https://github.com/${GH_USER}/${repo}` : undefined);

/**
 * Clean one article body: drop the leading metadata header (TOC blockquote, cross-lang line,
 * 🌱/🔗/⬅️/➡️ nav, a duplicate H1) and trailing prev/next nav. Returns the cleaned body plus any
 * GitHub repo/branch URLs found in the header. Conservative: stops at the first real content line,
 * and never strips trailing 🔗 (references) — only ⬅️/➡️ nav.
 */
function cleanBody(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let repo;
  let branch;
  let i = 0;
  let strippedAny = false;

  /** Classify a top-of-body line: 'blank' | 'meta' | null (real content → stop). */
  const classify = (line) => {
    const l = line.trim();
    if (l === '') return 'blank';
    const ghBranch = line.match(/🌱[^\n]*?\((https:\/\/github\.com\/[^)\s]+)\)/u);
    if (ghBranch) {
      branch ??= ghBranch[1];
      return 'meta';
    }
    const ghRepo = line.match(/🔗[^\n]*?\((https:\/\/github\.com\/[^)\s]+)\)/u);
    if (ghRepo) {
      repo ??= ghRepo[1];
      return 'meta';
    }
    const unquoted = l.replace(/^>+\s?/, '').trim();
    if (/^(?:🔗|🌐|🇧🇷|🌱|⬅️|➡️|📚|✍️|🤖)/u.test(unquoted)) return 'meta';
    if (l.startsWith('>')) {
      if (/\]\(#/.test(l)) return 'meta'; // TOC anchor bullet
      if (/^>\s*(?:Por|By)\s/.test(l)) return 'meta'; // author byline
      if (/^>\s*$/.test(l)) return 'meta'; // empty blockquote continuation
      if (/dev\.to\//.test(l)) return 'meta'; // leading canonical/cross-link line
      return null; // a genuine pull-quote → content
    }
    return null;
  };

  while (i < lines.length) {
    const kind = classify(lines[i]);
    if (kind === 'blank') {
      i++;
      continue;
    }
    if (kind === 'meta') {
      strippedAny = true;
      i++;
      continue;
    }
    // A horizontal rule directly after a header block is the header/content separator → drop it.
    if (strippedAny && /^(?:---|\*\*\*|___)\s*$/.test(lines[i].trim())) {
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
    }
    break;
  }

  let body = lines.slice(i).join('\n').trimStart();
  // Drop a leading duplicate H1 — the post route renders the title itself.
  body = body.replace(/^#\s+.+\n+/, '');

  // Trim trailing prev/next nav + separators (keep references / other content).
  const out = body.split('\n');
  const isTailNav = (line) => {
    const l = line.trim();
    return l === '' || /^(?:---|\*\*\*|___)$/.test(l) || /^(?:>?\s*)(?:⬅️|➡️)/u.test(l);
  };
  let j = out.length;
  while (j > 0 && isTailNav(out[j - 1])) j--;
  body = out.slice(0, j).join('\n').trim() + '\n';

  const liquid = (body.match(/\{%/g) || []).length;
  return { body, repo, branch, liquid };
}

/** Inline markdown → plain text (links to their text, drop images/emphasis), whitespace-collapsed. */
function stripMarkdown(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label
    .replace(/[*_`~]/g, '') // emphasis / code marks
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A description for the post. dev.to's `description` is auto-derived from the top of the body, which
 * for these posts is the nav header or the TOC — junk. So derive from the FIRST real prose paragraph
 * of the cleaned body instead (skipping headings, quotes, lists, images), capped for SEO. Falls back
 * to the dev.to value only when no prose paragraph is found.
 */
function deriveDescription(body, fallback) {
  const buf = [];
  for (const raw of body.split('\n')) {
    const l = raw.trim();
    const skip = l === '' || /^(?:#{1,6}\s|>|!\[|[-*+]\s|\d+\.\s|---|\*\*\*|```)/.test(l);
    if (skip) {
      if (buf.length) break;
      continue;
    }
    buf.push(l);
  }
  let d = stripMarkdown(buf.join(' '));
  if (d.length < 40 && fallback) d = stripMarkdown(fallback);
  if (d.length > 157) d = d.slice(0, 154).replace(/\s+\S*$/, '') + '…';
  return d;
}

/** Build YAML frontmatter + body for one `.md` file. */
function renderFile(data) {
  const fm = ['---', `title: ${scalar(data.title)}`, `description: ${scalar(data.description)}`];
  fm.push(`pubDate: ${data.pubDate}`);
  if (data.updatedDate && data.updatedDate !== data.pubDate)
    fm.push(`updatedDate: ${data.updatedDate}`);
  if (data.tags?.length) {
    fm.push('tags:');
    for (const t of data.tags) fm.push(`  - ${scalar(t)}`);
  } else {
    fm.push('tags: []');
  }
  if (data.series) fm.push(`series: ${scalar(data.series)}`);
  if (data.seriesOrder != null) fm.push(`seriesOrder: ${data.seriesOrder}`);
  if (data.coverUrl) fm.push(`coverUrl: ${scalar(data.coverUrl)}`);
  if (data.translated === false) fm.push('translated: false');
  const prov = data.provenance ?? {};
  const provKeys = Object.keys(prov).filter((k) => prov[k] != null && prov[k] !== '');
  if (provKeys.length) {
    fm.push('provenance:');
    for (const k of provKeys) fm.push(`  ${k}: ${scalar(prov[k])}`);
  }
  fm.push('---', '', data.body);
  return fm.join('\n');
}

// ───────────────────────────── load ─────────────────────────────

if (!existsSync(SOURCE)) {
  console.error(`✗ Source not found: ${SOURCE}\n  Run devto-export.mjs first, or pass --source.`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(join(SOURCE, 'manifest.json'), 'utf8'));
/** series slug → { label, repo (name) } from the manifest. */
const seriesMeta = new Map(
  manifest.series
    .filter((s) => s.slug !== '_standalone')
    .map((s) => [s.slug, { label: s.label, repo: s.repo }]),
);

/** Load every article (meta.json + body.md) by walking the articles tree. */
const articles = [];
const articlesRoot = join(SOURCE, 'articles');
for (const seriesDir of await readdir(articlesRoot, { withFileTypes: true })) {
  if (!seriesDir.isDirectory()) continue;
  const seriesPath = join(articlesRoot, seriesDir.name);
  for (const postDir of await readdir(seriesPath, { withFileTypes: true })) {
    if (!postDir.isDirectory()) continue;
    const dir = join(seriesPath, postDir.name);
    const meta = JSON.parse(await readFile(join(dir, 'meta.json'), 'utf8'));
    const rawBody = await readFile(join(dir, 'body.md'), 'utf8');
    articles.push({ meta, cleaned: cleanBody(rawBody) });
  }
}

// ───────────────────────────── group ─────────────────────────────
// One logical post = one bundle. Series posts pair across locales by (seriesSlug, order);
// standalone posts are keyed by devtoId (no pairing).
const groups = new Map();
for (const a of articles) {
  const s = a.meta.series;
  const key =
    s && s.slug !== '_standalone' ? `${s.slug}#${a.meta.order}` : `solo#${a.meta.devtoId}`;
  if (!groups.has(key)) groups.set(key, {});
  groups.get(key)[a.meta.locale] = a;
}

// ───────────────────────────── emit posts ─────────────────────────────
const usedSlugs = new Set();
const pending = []; // { series, title, slug, missingLocale } for the translations issue
const seriesCovers = new Map(); // slug → coverUrl of its part 1
let created = 0;
let liquidWarnings = [];

for (const members of groups.values()) {
  const primary = members['en'] ?? members['pt-br'];
  const pm = primary.meta;

  let slug = cleanSlug(pm.slug);
  if (usedSlugs.has(slug)) slug = pm.slug; // collision → keep the unique dev.to slug
  if (usedSlugs.has(slug)) slug = `${slug}-${pm.devtoId}`; // last resort
  usedSlugs.add(slug);

  // Remember a cover for the series spotlight (prefer part 1).
  if (pm.series?.slug && pm.series.slug !== '_standalone' && pm.order === 1 && pm.coverImage) {
    seriesCovers.set(pm.series.slug, pm.coverImage);
  }

  const bundleDir = join(BLOG_OUT, slug);
  await mkdir(bundleDir, { recursive: true });

  for (const locale of URL_LOCALES) {
    const member = members[locale];
    const src = member ?? primary;
    const sm = src.meta;
    const seriesRepoUrl = ghRepoUrl(sm.series?.repo);
    const provenance = {
      devtoUrl: sm.devtoUrl,
      devtoId: sm.devtoId,
      githubRepo: src.cleaned.repo ?? seriesRepoUrl,
      githubBranch: src.cleaned.branch,
      reactions: sm.reactions > 0 ? sm.reactions : undefined,
    };
    const file = renderFile({
      title: sm.title,
      description: deriveDescription(src.cleaned.body, sm.description),
      pubDate: dateOnly(sm.publishedAt),
      updatedDate: dateOnly(sm.editedAt),
      tags: sm.tags,
      series: sm.series?.slug !== '_standalone' ? sm.series?.slug : undefined,
      seriesOrder: sm.series?.slug !== '_standalone' ? sm.order : undefined,
      coverUrl: sm.coverImage ?? undefined,
      translated: member ? undefined : false,
      provenance,
      body: src.cleaned.body,
    });
    await writeFile(join(bundleDir, `index.${SUFFIX[locale]}.md`), file);
    created++;
    if (!member)
      pending.push({
        series: pm.series?.slug ?? 'standalone',
        title: pm.title,
        slug,
        missing: locale,
      });
    if (src.cleaned.liquid > 0)
      liquidWarnings.push(`${slug} (${locale}): ${src.cleaned.liquid} Liquid tag(s)`);
  }
}

// ───────────────────────────── emit series ─────────────────────────────
await mkdir(SERIES_OUT, { recursive: true });
for (const [slug, info] of seriesMeta) {
  const yaml = [
    `label: ${scalar(info.label)}`,
    SERIES_ORDER[slug] != null ? `order: ${SERIES_ORDER[slug]}` : null,
    info.repo ? `repo: ${scalar(ghRepoUrl(info.repo))}` : null,
    seriesCovers.has(slug) ? `coverUrl: ${scalar(seriesCovers.get(slug))}` : null,
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');
  // Same metadata for both locales (labels are language-neutral); presence satisfies the guardrail.
  await writeFile(join(SERIES_OUT, `${slug}.en.yaml`), yaml);
  await writeFile(join(SERIES_OUT, `${slug}.pt.yaml`), yaml);
}

// ───────────────────────────── report ─────────────────────────────
console.log(
  `\n▸ Ingested ${groups.size} posts → ${created} files across ${seriesMeta.size} series.`,
);
console.log(`  blog bundles: src/content/blog/<slug>/index.{en,pt}.md`);
console.log(`  series:       src/content/series/<slug>.{en,pt}.yaml`);

if (liquidWarnings.length) {
  console.log(
    `\n⚠ ${liquidWarnings.length} file(s) still contain dev.to Liquid tags (manual review):`,
  );
  for (const w of liquidWarnings) console.log(`   • ${w}`);
}

// Paste-ready checklist for the "translate mirrored posts" issue, grouped by series.
const bySeries = new Map();
for (const p of pending) {
  if (!bySeries.has(p.series)) bySeries.set(p.series, new Set());
  bySeries.get(p.series).add(`${p.title}  (\`${p.slug}\` → missing ${p.missing})`);
}
console.log(`\n──────── PENDING TRANSLATIONS (${pending.length}) ────────`);
for (const [series, items] of [...bySeries].sort()) {
  console.log(`\n### ${series}`);
  for (const it of [...items].sort()) console.log(`- [ ] ${it}`);
}
