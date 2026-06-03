import { defineCollection } from 'astro:content';
// Use Astro's bundled Zod (a separately-installed `zod` would be a second instance and break
// the `image()` schema helper). With Astro 6.4 + Zod 4.4 this `z` surfaces upstream `ts(6385)`
// "deprecated" hints from the internal `zod/v4` re-export — they're harmless; the `typecheck`
// script filters hint-level diagnostics (`--minimumSeverity warning`).
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

/*
 * Content collections (Astro Content Layer + Zod) — skeleton per research §04.
 *
 * Each collection's typed frontmatter is the source for JSON-LD structured data, emitted in
 * the SEO epic (#52): blog → BlogPosting, portfolio → CreativeWork/SoftwareSourceCode,
 * events → Event, cv → Person. Keep schemas semantic so that wiring stays mechanical.
 *
 * Bilingual convention (§04): parallel per-locale files — `<slug>.en.mdx` / `<slug>.pt.mdx`
 * (or page bundles `<slug>/index.en.mdx` with co-located images). Schemas here stay
 * locale-agnostic on purpose; the i18n epic (#24) adds the Zod-backed locale-completeness
 * guardrail (a missing translation becomes a build error). Heavy media (galleries, large
 * downloads) lives in Cloudflare R2, not the repo — only post-coupled images co-locate.
 */

/** Shared frontmatter across prose collections. */
const base = z.object({
  title: z.string(),
  description: z.string(),
  /** Hidden from listings until ready; the cron rebuild for future-dated posts is later work. */
  draft: z.boolean().default(false),
});

/**
 * Provenance for posts mirrored in-house from elsewhere (dev.to is the syndication copy; this site
 * is canonical). Every field is optional: a hand-written post has none, and the `ArticleMeta`
 * component renders nothing when the whole object is absent/empty.
 */
const provenance = z
  .object({
    /** The dev.to original — shown as an "originally published" cross-link (never rel=canonical). */
    devtoUrl: z.url().optional(),
    /** dev.to numeric article id — the target for the later `canonical_url` write-back script. */
    devtoId: z.number().int().optional(),
    /** Companion source repository for the post (series-level, denormalized for convenience). */
    githubRepo: z.url().optional(),
    /** Per-post branch/tree link parsed from the article body header (richer than the repo root). */
    githubBranch: z.url().optional(),
    /** dev.to reaction count at import time — a light social proof signal, not kept in sync. */
    reactions: z.number().int().optional(),
  })
  .optional();

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    base.extend({
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      /**
       * Answer-first capsule (#56): a 1–3 sentence direct answer rendered as a visible lede above
       * the prose — the highest-leverage GEO/AEO formatting lever. Distinct from `description`
       * (the meta/OG/SERP snippet): `summary` is the on-page answer; both can diverge.
       */
      summary: z.string().max(320).optional(),
      /** Remote cover URL (dev.to CDN) until media moves to R2 (#R2). Distinct from local `cover`. */
      coverUrl: z.url().optional(),
      /**
       * Series membership. The value is a series *slug* (e.g. `kmp-101`) matched against the
       * `series` collection by its filePath-derived slug — NOT an Astro `reference()`, because the
       * glob loader mangles dotted per-locale ids (`kmp-101.en.yaml` → `kmp-101en`), which would
       * make a post bind to one locale's file. Standalone posts omit both fields.
       */
      series: z.string().optional(),
      seriesOrder: z.number().int().optional(),
      /**
       * Whether this file holds a real translation for its locale. `false` means it carries the
       * original-language body as a placeholder (kept so the locale-completeness guardrail passes);
       * the post route shows a "shown in original language" banner and it's listed for translation.
       */
      translated: z.boolean().default(true),
      /** Opt a post out of the Giscus comment thread (#195). Comments are on by default. */
      comments: z.boolean().default(true),
      provenance,
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/portfolio' }),
  schema: ({ image }) =>
    base.extend({
      /** Source repository → SoftwareSourceCode.codeRepository. */
      repo: z.url().optional(),
      tech: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      cover: image().optional(),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: base.extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string().optional(),
    /** Talk/event landing page. */
    url: z.url().optional(),
    /** Kind of appearance → maps to a schema.org Event subtype later (#52). */
    kind: z.enum(['talk', 'workshop', 'panel', 'conference']).default('talk'),
    /** Slide deck URL (Speaker Deck / Google Slides / PDF). */
    slides: z.url().optional(),
    /** Recording URL (a YouTube watch URL → rendered through a facade, #34). */
    video: z.url().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: base,
});

/** CV is structured data, not prose → per-locale YAML feeding Person/knowsAbout JSON-LD. */
const cv = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/cv' }),
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string().optional(),
    email: z.email().optional(),
    summary: z.string().optional(),
    /** Topical authority → Person.knowsAbout (§04/§06). */
    knowsAbout: z.array(z.string()).default([]),
    /** Entity reconciliation → Person.sameAs. */
    profiles: z.array(z.object({ network: z.string(), url: z.url() })).default([]),
    work: z
      .array(
        z.object({
          company: z.string(),
          role: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          summary: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

/**
 * Photo galleries (#36) and downloadable materials (#37). The binaries live in Cloudflare R2 (or
 * the local `public/media/` placeholder), resolved at render via `mediaUrl()` — only this metadata
 * lives in git. Modeled as per-locale YAML collections (not config arrays) so the locale-completeness
 * guardrail enforces both-locale captions/titles for free.
 */
const photos = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/photos' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    items: z
      .array(
        z.object({
          /** Media path resolved by `mediaUrl()` — NOT an astro:assets import. */
          src: z.string(),
          alt: z.string(),
          /** Intrinsic dimensions, when known, to reserve space and avoid CLS. */
          width: z.number().optional(),
          height: z.number().optional(),
        }),
      )
      .default([]),
  }),
});

const materials = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/materials' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    items: z
      .array(
        z.object({
          /** Media path resolved by `mediaUrl()`. */
          file: z.string(),
          title: z.string(),
          description: z.string().optional(),
          /** Free-form badge (`pdf`, `slides`, `zip`, …). */
          kind: z.string().optional(),
        }),
      )
      .default([]),
  }),
});

/**
 * Blog series (#31) — display metadata for a group of ordered posts (the `SeriesSpotlight` cards
 * and the `/series/<slug>` landing). Per-locale YAML so the locale-completeness guardrail enforces
 * both-locale labels for free, mirroring cv/photos/materials. The series *slug* is its filename
 * (parsed by `src/lib/content.ts`), so a post's `series: <slug>` joins here without `reference()`.
 */
const series = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/series' }),
  schema: z.object({
    label: z.string(),
    description: z.string().optional(),
    /** Spotlight ordering (lower = first); ties fall back to post count then slug. */
    order: z.number().int().optional(),
    /** Companion repository for the whole series → shown on the series landing. */
    repo: z.url().optional(),
    /** Remote cover URL (dev.to CDN) until media moves to R2 (#R2). */
    coverUrl: z.url().optional(),
  }),
});

export const collections = { blog, portfolio, events, pages, cv, photos, materials, series };
