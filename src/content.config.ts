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
    /** Talk/event page, slides, or recording. */
    url: z.url().optional(),
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

export const collections = { blog, portfolio, events, pages, cv };
