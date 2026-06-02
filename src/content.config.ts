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

export const collections = { blog, portfolio, events, pages, cv, photos, materials };
