# CLAUDE.md — project north star

> Read this first. It captures what we're building and the decisions already made, so we don't
> re-litigate them. Deep detail lives in `research/` (start with `research/SUMMARY.md`).

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

🚧 **Bootstrapping.** Research is complete (`research/` — 8 deep-research reports + `SUMMARY.md`).
App scaffold (Astro) is the next step. No app code yet.

## Firm constraints

1. **Fully bilingual** (pt-BR + English), defaulting to the visitor's browser locale.
2. **GitHub repo = source of truth** → push = **auto-deploy**, no manual deploy step.
3. Domain **`rsicarelli.com`** is already owned (DNS wiring only).
4. **Performance + Google SEO + AI/LLM discoverability (GEO/AEO)** are all first-class.
5. **Free / open-source-first** where viable.

## Decided stack (research convergence — see `research/SUMMARY.md`)

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

- Keep `research/` as the durable foundation; revisit `SUMMARY.md` before big decisions.
- Planned content structure follows `research/04-content-architecture-repo.result.md` (§04).
- **Work tracking:** GitHub Projects (to be set up).

> The global `~/.claude/CLAUDE.md` (RTK) still applies; this file is additive and project-scoped.
