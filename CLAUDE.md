# CLAUDE.md — project north star

> Read this first. It captures what we're building and the decisions already made, so we don't
> re-litigate them. Deep detail lives in the private research repo
> **rsicarelli/personal-site-private** (start with `SUMMARY.md`):
> <https://github.com/rsicarelli/personal-site-private>.

## What we're building

**rsicarelli.com** — a fully bilingual (pt-BR / English) personal website and content hub:
blog, CV, portfolio, contact, upcoming events, photos from talks/participations, downloadable
materials, and (later) exclusive **paid content** (e.g. courses).

The GitHub repo is the **source of truth**: pushing content auto-deploys the live site ("git as CMS").

## Who

**Rodrigo Sicarelli** — Staff Software Engineer (Mobile Platform) at Stone; ~15 yrs experience;
São Paulo, Brazil. KotlinConf 2025 speaker, Google KMP Acceleration Program, Brazil's leading KMP
authority, OSS maintainer (`fakt`, `kmp-targets`, `kmp-native-flavors`), technical writer. Highly
technical (Kotlin, Swift, KMP, TypeScript, Python, Rust, Gradle, GitHub Actions) and owns/edits this
repo personally — developer-author ergonomics matter.

## Status

🚧 **Bootstrapping.** Research is complete (private repo **rsicarelli/personal-site-private** — 8 deep-research reports + `SUMMARY.md`).
App scaffold (Astro) is the next step. No app code yet.

## Firm constraints

1. **Fully bilingual** (pt-BR + English), defaulting to the visitor's browser locale.
2. **GitHub repo = source of truth** → push = **auto-deploy**, no manual deploy step.
3. Domain **`rsicarelli.com`** is already owned (DNS wiring only).
4. **Performance + Google SEO + AI/LLM discoverability (GEO/AEO)** are all first-class.
5. **Free / open-source-first** where viable.

## Decided stack (research convergence — see `SUMMARY.md` in **rsicarelli/personal-site-private**)

- **Framework:** Astro (SSG + islands, zero-JS by default), Content Layer + Zod schemas.
- **Hosting:** Cloudflare Pages (native git auto-deploy from GitHub; PR previews).
- **DNS + media:** Cloudflare DNS (apex CNAME flattening + www, free TLS) + **R2** for photos/downloads.
- **Styling:** Tailwind CSS v4 (or vanilla CSS + design tokens) + shadcn/ui for interactive bits.
- **i18n:** subdirectory URLs `/en/` + `/pt-br/`; detect browser locale only at `/`.
- **Analytics:** Umami (cookieless, no cookie banner) + Cloudflare Web Analytics as a free baseline.
- **Design direction:** "minimalist editorial + one distinctive accent"; self-hosted variable
  typeface with full pt-BR diacritics (Inter or IBM Plex Sans) + a mono.

## Guardrails from research (don't violate)

- **Never hard-redirect by IP/locale** (301/302) — Googlebot crawls from US IPs without
  `Accept-Language` and would miss the non-English pages. Detect at `/` only, keep a visible switcher.
- **Avoid Git LFS** for media — use Cloudflare R2 instead.
- **Reciprocal hreflang** (pt-BR / en / x-default) on every page; validate in CI.
- **Answer-first content**; allow AI crawlers in `robots.txt`; submit sitemaps to Google **and Bing**.
- `llms.txt` is cheap insurance, not a strategy (no AI engine confirmed to use it).
- **Don't anchor on Vercel Hobby or GitHub Pages** — both ban commercial use (matters for paid content).

## Open decisions (deferred)

- **CMS UI:** none (edit MDX in IDE) vs Keystatic vs Sveltia — direct editing works day one.
- **Deploy target:** Cloudflare Pages vs Workers Static Assets (both work today).
- **Payments + tax:** Brazil/Pix audience → Hotmart/Kiwify/Mercado Pago/Stripe; global → Paddle (only
  MoR with Pix). Pessoa física (carnê-leão) vs MEI/CNPJ. Decoupled from the framework — no lock-in.

## Conventions

- Keep the private research repo **rsicarelli/personal-site-private** as the durable foundation; revisit `SUMMARY.md` there before big decisions.
- Planned content structure follows `04-content-architecture-repo.result.md` (§04) in **rsicarelli/personal-site-private**.
- **Work tracking:** GitHub Projects (to be set up).

### Content authoring (Epic 4)

- **Bilingual is mandatory.** Every content entry exists in both locales: parallel files
  `<slug>.en.<ext>` + `<slug>.pt.<ext>`. The CI guardrail (`scripts/check-locale-completeness.mjs`)
  fails the build on a missing locale OR any content file lacking an `.en`/`.pt` suffix. (On disk
  the suffix is `.pt`; the URL locale is `/pt-br/`.)
- **File layout:** `blog`, `portfolio`, `events` use **page bundles** (`<slug>/index.en.mdx` +
  co-located `cover.jpg`); `pages`, `cv` (+ `uses`/`now`/`contact` under `pages`) stay **flat**
  (`<slug>.en.mdx`). Never mix a flat file and a bundle for the same slug — `src/lib/content.ts`
  throws on the resulting slug collision.
- **Routing** keys off `entry.filePath`, never the slugified `id` (the glob loader drops dots).
  All listing/detail routes go through the `src/lib/content.ts` helpers (`getLocalizedEntries`,
  `getLocalizedEntry`, `localizedPaths`). Drafts (`draft: true`) are hidden in prod, shown in dev.
- **Dates** are date-only, authored as `YYYY-MM-DD` (parsed as UTC midnight by `z.coerce.date()`).
  Always render them through `src/lib/datetime.ts` (`formatDate` for the human label, `isoDate` for
  the `<time datetime>`) — both format in **UTC** so the calendar day never shifts by one in a
  negative-offset timezone. Don't build a `new Intl.DateTimeFormat` inline. (`new Date()` for
  "now"/the footer year is build-time and fine.) CV work dates stay free-text strings (`2021`,
  `Present`), not parsed.
- **Media** (photos/downloads) lives in Cloudflare R2 / the local `public/media/` placeholder —
  never in git (no Git LFS). Only metadata lives in `src/content/{photos,materials}`; resolve URLs
  with `mediaUrl()` (`src/lib/media.ts`) against `PUBLIC_MEDIA_BASE_URL`.
- **Visual layer is Epic 5's** (`src/styles/**`, `src/components/ui/**`, the layout shell, fonts,
  `Image`/`lite-youtube`). Pages consume semantic token classes and those components — never add
  tokens or duplicate them.

> The global `~/.claude/CLAUDE.md` (RTK) still applies; this file is additive and project-scoped.
