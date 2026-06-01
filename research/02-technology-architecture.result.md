# Web Tech & Architecture for rsicarelli.com — An Unbiased 2025–2026 Landscape Report

## TL;DR
- **For a content-heavy, fully bilingual (pt-BR/EN) personal site that auto-deploys from GitHub, the strongest fit in the 2025–2026 landscape is an islands-architecture static site generator — Astro is the front-runner — deployed to Cloudflare Pages via GitHub Actions; Hugo and Eleventy are the leading minimalist alternatives, and full-stack frameworks (Next.js, SvelteKit, Nuxt) are over-engineered for a mostly-content site but matter if the paid-courses ambition becomes the primary product.** This combination cleanly satisfies every firm constraint: bilingual routing with browser-locale detection, git-as-CMS auto-deploy, top-tier performance/SEO, and a near-$0 cost on free/OSS tooling.
- **The minimum-complexity stack that satisfies all constraints**: Astro (built-in i18n routing + Content Layer/Content Collections for type-safe bilingual content) → push to GitHub → GitHub Actions builds → Cloudflare Pages serves with unlimited bandwidth on the free tier. Optionally add Keystatic (free, MIT, TypeScript-native, first-party Astro integration) as a Git-based editing UI without breaking git-as-source-of-truth.
- **The future paid-content ambition does not require choosing a heavier framework now.** Astro extends to gated/paid content via Server Islands + Actions (hybrid SSR with an adapter), Better Auth/Clerk for auth, and Stripe for payments — so you can stay content-first today and add commerce later without re-platforming.

## Key Findings

1. **Islands/SSG is the right rendering model.** For a fast, SEO- and GEO-friendly, mostly-content site, static generation (SSG) with partial hydration (islands) is the consensus best fit. It ships HTML with little or no JavaScript, which is exactly what both Google crawlers and AI retrieval bots parse most reliably.

2. **Astro leads on momentum and fit.** Per Astro's official "2024 year in review" citing State of JavaScript 2024 (Dec 2024), Astro ranked #1 among meta-frameworks in Interest, Retention, and Positivity, and its Usage "rose from 4th to 2nd this year, trailing only Next.js." In State of JavaScript 2025 (Devographics, ~12,000 respondents surveyed Nov 2025, published Feb 2026), Astro holds the #1 satisfaction spot; Next.js's "satisfaction ratio now has a 39% gap with leader Astro," with Next.js satisfaction dropping from 68% to 55%. On 16 January 2026 Cloudflare acquired The Astro Technology Company — CEO Matthew Prince said the goal was to "ensure Astro continues to be the best web framework for content-driven websites" — a momentum signal but also a new governance consideration (see Caveats).

3. **i18n difficulty varies enormously by framework.** Astro (built-in v4+ i18n routing with `Astro.preferredLocale` browser detection), Hugo (mature multilingual by filename/directory), and Eleventy (i18n plugin) make bilingual sites straightforward. Next.js is the most painful: the App Router removed built-in i18n routing, forcing a third-party library (next-intl) plus middleware.

4. **Cloudflare Pages is the cleanest auto-deploy + hosting story for a static bilingual site** — unlimited bandwidth on the free tier, 500 builds/month, Git push → build → deploy. Vercel's Hobby plan prohibits commercial use (relevant once you sell courses).

5. **Type-safe content is a solved problem in Astro.** Astro Content Collections + the Content Layer API (Astro 5) give frontmatter schemas, Zod validation, and TypeScript types for blog posts, CV data, portfolio items, events, and galleries. Contentlayer is effectively abandoned; Velite is the actively maintained type-safe alternative for non-Astro stacks.

6. **Keep large binaries out of Git.** Git LFS has quota/bandwidth costs and friction; the better pattern for talk-photo galleries is build-time image optimization (Astro `<Image>`/sharp) for in-repo images, and an external object store + CDN (Cloudflare R2, zero egress) for heavy galleries.

## Details

### 1. Rendering strategies (SSG vs SSR vs ISR vs edge vs islands)

- **SSG (Static Site Generation):** Pages pre-rendered to HTML at build time, served from a CDN. Best performance, SEO, security, and cost for content that changes on a push cadence. This is the natural fit for a blog/CV/portfolio.
- **SSR (Server-Side Rendering):** HTML generated per request. Needed for per-user/personalized or frequently-changing content. Overkill for static content but useful for the future gated-content pages.
- **ISR (Incremental Static Regeneration):** Pages regenerated in the background after a time/trigger. A Next.js/Vercel concept; useful for large catalogs but adds platform coupling and (on Vercel) metered ISR reads/writes.
- **Edge rendering:** SSR executed at CDN edge locations for low latency. Relevant for global personalization, not for static content.
- **Islands architecture / partial hydration (Astro):** Page renders as static HTML with zero JS by default; only interactive "islands" hydrate. This gives SSG performance with selective interactivity — the best match for a content site that occasionally needs a widget.

**Verdict:** SSG + islands is the right default; the ability to opt individual routes into SSR/edge later (Astro, SvelteKit, Next.js all support this) is the extensibility insurance you want.

### 2. Static Site Generators

- **Astro** — JS/TS framework, islands architecture, zero-JS-by-default. Content Collections + Content Layer API for type-safe content. Built-in i18n routing. Vite-based dev server with fast HMR. Best-in-class for content sites; can mix React/Svelte/Vue islands. Builds slower than Hugo but fine for hundreds of pages. Now under Cloudflare stewardship (Jan 2026). **Best for: exactly this use case.**
- **Hugo** — Go, single binary, fastest builds (sub-second for thousands of pages; one benchmark cited ~0.4s for 10,000 pages). Mature multilingual by filename (`post.en.md`/`post.pt-br.md`) or directory, with built-in image processing. No Node ecosystem; templating is Go templates (less familiar than JSX/TS). **Best for: very large content volumes, speed-obsessed, minimal-JS purists.**
- **Eleventy (11ty)** — Node/JS, zero-JS by default, "bring your own templating" (Nunjucks, Liquid, etc.). Very flexible, minimal lock-in. i18n via official plugin. ~2.1s to build 1,000 pages in one benchmark. **Best for: maximal control, minimal abstraction.**
- **Zola** — Rust, single binary, very fast, built-in i18n. Smaller ecosystem; templating is Tera. **Best for: Rust affinity, simplicity.** (Note for Rodrigo: Rust is in your toolset, so Zola is ergonomically interesting, but its ecosystem and theme/CMS support are far thinner than Astro/Hugo.)
- **Jekyll** — Ruby, the GitHub Pages default; mature but dated, slower, Ruby toolchain. **Best for: GitHub Pages purists.**
- **Gatsby** — React, historically notorious for slow builds and a complex GraphQL data layer; declining momentum (State of JS shows it as a low-retention outlier). **Generally not recommended for new projects in 2026.**
- **Lume (Deno), Bridgetown (Ruby)** — niche, smaller communities; worth knowing but not front-runners.

### 3. Full-stack / hybrid frameworks (in static/hybrid mode)

- **Next.js (React)** — Dominant by usage; supports SSG/SSR/ISR/edge. But App Router i18n is painful (removed built-in, needs next-intl + middleware), satisfaction is declining, and it's over-engineered for a content site. Vercel Hobby plan bans commercial use. **Consider only if paid courses become the primary product.**
- **SvelteKit** — Compiler-based, near-zero runtime JS; SSG via prerendering or hybrid. i18n via Paraglide/inlang (compiler-based, tree-shakable, claimed up to ~70% smaller i18n bundles) — clean but you assemble more yourself. **Strong if you prefer Svelte's DX.**
- **Nuxt (Vue)** — Full-stack Vue; excellent `@nuxt/i18n` module and Nuxt Content. Nuxt 3 reaches EOL 31 July 2026, so a v4 migration looms. **Good if you're a Vue person.**
- **Remix → React Router 7** — Remix merged into React Router 7; now supports SSG/SSR. Fine but no content-site advantage over Astro.
- **TanStack Start, SolidStart, Qwik** — newer, SSR-first (Qwik's "resumability" is interesting for performance), but smaller ecosystems and more over-engineering risk for a content site.

### 4. The content layer (type-safe content)

- **Astro Content Collections + Content Layer API (Astro 5):** Define collections with Zod schemas in `content.config.ts`; get frontmatter validation, TypeScript types, and `getCollection()`/`getEntry()` queries. The Content Layer (stabilized in Astro 5, after an experimental release in Astro 4.14) loads from local Markdown/MDX or any remote source, scales to many thousands of entries, and caches between builds. This cleanly models blog posts, CV data (JSON/YAML data collections), portfolio items, events, photo galleries, and downloadable materials. **This is a decisive Astro advantage.**
- **Velite:** Framework-agnostic, actively maintained, Zod-based — the leading type-safe content tool for non-Astro stacks (e.g., Next.js).
- **Contentlayer:** Effectively abandoned (maintainer stated he can allocate ~one day a month); community fork Contentlayer2 exists but is not a safe bet. **Avoid for new projects.**
- **Nuxt Content:** Strong for Nuxt; file-based, queryable, with i18n support.

### 5. Bilingual (pt-BR/EN) implementation by framework

- **Routing strategy recommendation:** Path-prefix (`/en/…`, `/pt-br/…`) is the simplest, works with static hosting, and is SEO-friendly. Subdomains and separate domains add DNS/config overhead with little benefit for a personal site. Add `hreflang` alternate tags and a per-locale sitemap (Astro's `@astrojs/sitemap` auto-generates per language).
- **Astro:** Built-in i18n routing (v4+). Configure `locales: ["en","pt-br"]`, `defaultLocale`. `Astro.preferredLocale`/`Astro.preferredLocaleList` compute the visitor's preferred language from the `Accept-Language` header (works on on-demand-rendered pages; static pages can use middleware/client redirect). Per-locale fallback (`fallbackType: "rewrite"`) avoids 404s. **Low-to-moderate effort.**
- **Hugo:** Mature multilingual; translate by filename or directory, `i18n/*.toml` string tables, `defaultContentLanguageInSubdir`, per-language slugs, and `.Translations` for hreflang. **Low effort, very robust.**
- **Eleventy:** Official i18n plugin + `Intl`; more manual but flexible. **Moderate effort.**
- **SvelteKit:** Paraglide/inlang is the official-recommended, compiler-based approach (type-safe, tree-shakable). Some deployment caveats (AsyncLocalStorage on Cloudflare/Vercel; Cloudflare needs the `nodejs_als` flag). **Moderate effort.**
- **Next.js (App Router):** The hardest. Built-in i18n removed; use next-intl with `[locale]` segment + middleware, `setRequestLocale` for static rendering. Known Next.js 16 middleware breakages with i18n libs. **High effort.**

### 6. Authoring ergonomics & optional Git-based CMS

For a solo technical owner editing in Git, you may not need a CMS at all — editing Markdown/MDX directly with a fast dev server (Astro/Vite HMR) is ergonomic. But an optional Git-based CMS layer can add a nicer editing UI without breaking git-as-source-of-truth (all of these commit to your repo):

- **Keystatic (Thinkmill)** — Free, MIT, open source. TypeScript-native schema, first-party Astro and Next.js integrations, Git-based (commits to GitHub), no database. Latest `@keystatic/core` is on the 0.x line ("experimental" per README) but actively maintained through late 2025; backed by a profitably-run consultancy (not VC). Thinkmill states Keystatic "is, and will continue to be, free and open source." Reviewers call its Astro DX "genuinely excellent." Requires a small backend for the editing UI. (An optional Keystatic Cloud add-on exists; per a third-party review, Free up to 3 users, Pro ~$10/month/team + $5/user beyond 3 — verify against the official pricing page.) **Best fit for an Astro + TypeScript owner.**
- **Sveltia CMS** — Free, OSS, modern rewrite of Decap with first-class i18n and better UX; reuses Decap config. Migration-oriented (built as a Decap successor).
- **Decap CMS (ex-Netlify CMS)** — Most established (~18k GitHub stars), widest backend support, but YAML config dated and development pace slowed after Netlify handed it to the community in 2023.
- **TinaCMS** — Visual in-context editing (unique), but adds a cloud/SaaS dependency and setup complexity; Astro support experimental.
- **Pages CMS / Outstatic** — lightweight GitHub-committing editors.

**Recommendation:** Start without a CMS; add Keystatic if/when you want a browser editing UI (especially handy for editing on the go).

### 7. Long-term maintainability & lock-in

- **Framework lock-in:** Astro content is Markdown/MDX + frontmatter (portable); islands can be plain `.astro` or any framework. Hugo/Eleventy content is also portable Markdown. The main lock-in is templating/config, not content.
- **Hosting lock-in:** Cloudflare Pages, Netlify, and GitHub Pages all serve standard static output — easy to migrate. Vercel ISR and Next.js-specific features create the most coupling.
- **Content-format lock-in:** Markdown/MDX is the universal, durable format. Avoid proprietary CMS databases for a solo project.
- **Solo maintenance burden:** Astro and Hugo have large communities and stable release cadences. Astro's Cloudflare acquisition (Jan 2026) is a momentum positive but concentrates governance under one corporate owner — monitor for tighter Cloudflare coupling over time (Astro states it remains MIT, open-governance, and multi-deploy; CEO Fred Schott said Astro "will continue to be the best way for developers to build content-driven websites, whether they host on Cloudflare or elsewhere").

### Auto-deploy & hosting (the "push = live bilingual site" question)

- **Cloudflare Pages — recommended.** Free tier: unlimited bandwidth (no egress fees), 500 builds/month, 1 concurrent build, 100 custom domains/project, commercial use allowed. Git push → build → deploy. Workers Paid ($5/mo ≈ R$25/mo) adds 5,000 builds/month and serverless headroom for future paid content. R2 object storage has zero egress — ideal for photo galleries.
- **Netlify** — Excellent DX, built-in forms/identity. Free tier moved to a credit system (300 credits/month for newer accounts; legacy accounts keep 100 GB bandwidth + 300 build minutes); commercial use allowed on free tier. Pro ~$19/mo per member (≈ R$96/mo).
- **Vercel** — Best Next.js DX; Hobby free tier is generous on bandwidth (~100 GB) but **prohibits commercial use** — a real constraint once you sell courses. Pro is $20/seat/mo (≈ R$101/mo). ISR reads/writes are metered.
- **GitHub Pages** — Free, simplest, but ~1 GB site limit, no native LFS fetch (must materialize in Actions), and weaker for heavy media. Fine for a lean text site; limiting for image-heavy galleries.

All of these support a GitHub Actions workflow (`actions/checkout` → build → deploy). Cloudflare Pages and Netlify also offer native Git integration that builds on push with no Actions file needed.

### Build times & scaling

- Hugo is the speed champion (sub-second at 10,000 pages in published benchmarks). Astro/Eleventy/Next.js are Node-based and slower per-page, but for hundreds of posts/photos all are acceptable (single-digit seconds to low minutes). Astro's Content Layer caches between builds to mitigate growth. Gatsby's historical build-time pain is a reason to avoid it. Image processing is usually the real build-time cost (see below), not Markdown rendering.

### Images, galleries & large binaries

- **In-repo images:** Astro's `<Image>`/`<Picture>` (sharp) auto-converts to WebP/AVIF, generates responsive `srcset`, and lazy-loads — directly improving LCP/SEO. Hugo has built-in image processing; Next has `next/image`. Build-time optimization of many images can balloon build times (one developer with ~1,200 hike photos hit Netlify build timeouts on Gatsby before migrating to Astro), so cap concurrency/quality and consider lazy generation.
- **Heavy galleries (talk photos):** Prefer an external object store + CDN (Cloudflare R2 zero-egress, or S3+CloudFront/Cloudinary) over committing large binaries to Git.
- **Git LFS reality:** LFS keeps the source branch lean but has storage/bandwidth quotas (GitHub free LFS is limited; GitHub Pages sites should stay under ~1 GB and repos under ~5 GB), history-rewrite pain, and CI must materialize pointers (`git lfs pull`) or builds break. For a static site, external object storage + CDN is generally simpler and cheaper than LFS for large media.

### Performance, SEO & AI/LLM discoverability (GEO)

- **Performance/SEO:** SSG + islands gives fast LCP, clean semantic HTML, and minimal JS — the strongest foundation for Google ranking. Add per-locale sitemaps and hreflang.
- **GEO (ChatGPT, Claude, Perplexity, Gemini):** The evidence is clear-eyed: clean, server-rendered HTML and strong content/authority are what actually drive AI citations — not metadata tricks. The peer-reviewed "GEO: Generative Engine Optimization" study (Aggarwal et al., Princeton/Georgia Tech/IIT Delhi, KDD 2024, arXiv:2311.09735) found the best methods improved visibility ~41% (statistics addition) and ~28% (quotation addition) on its metrics, and that the "Cite Sources" method "led to a substantial 115.1% increase in visibility for websites ranked fifth in SERP." Crawler demand is surging: per Cloudflare's 2025 Radar Year in Review (Dec 15, 2025), AI "user action" crawling "increased by over 15x in 2025."
- **`llms.txt`:** A proposed standard (Jeremy Howard, 2024) — a curated Markdown index at your domain root. Adoption is real but its impact is contested: Google's John Mueller stated in October 2025, "As far as I know no AI system currently uses llms.txt," and at Search Central Live July 2025 Gary Illyes said Google doesn't support it and isn't planning to. It's near-zero cost to add and can help developer tooling (Cursor, Copilot) and integrations, so add it as a low-cost bet — but don't treat it as a silver bullet. Configure `robots.txt` to allow AI search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot, etc.).

### Extending to paid content/courses later (without re-platforming)

- **Astro Actions** (added in Astro 4.15): type-safe backend functions with Zod validation, callable from forms/components; can be gated from middleware (Astro 5.0). Astro warns that Actions are public endpoints, so apply the same authorization checks as any API.
- **Astro Server Islands** (experimental in Astro 4.12, primitive in Astro 5.0): the `server:defer` directive renders personalized/dynamic components on demand while the rest of the page stays static and CDN-cached — ideal for "logged-in" UI or gated previews. Astro states Server Islands are portable and "doesn't depend on any server infrastructure so it will work with any host you have."
- **Hybrid SSR via adapters:** Cloudflare, Netlify, Vercel, Node adapters let you opt specific routes into on-demand rendering while keeping the blog static.
- **Auth:** No official Astro auth, but the docs recommend Better Auth (self-hosted, TypeScript-first, has an official Stripe plugin) and Clerk (managed, free up to 10,000 MAU). Note: Lucia Auth was deprecated in 2025, with Better Auth the common migration target.
- **Payments:** Astro's official e-commerce guide covers Stripe, Lemon Squeezy, Paddle, and Snipcart. Multiple 2024–2026 tutorials demonstrate Stripe Checkout + webhooks via Astro Actions/SSR.
- **Lock-in tradeoff:** Low on the Astro side (portable primitives); the real lock-in vectors are the hosting adapter (host-specific KV/Blob bindings) and the auth/payment vendor (Clerk = managed/per-MAU; Better Auth = self-hosted/more ops; Stripe is portable across frameworks). Next.js/SvelteKit have a modest edge for heavy commerce as always-on app-first frameworks, but for a content-first site that merely adds gated courses, re-platforming is not warranted.

## Comparison Table

| Option | Lang/Runtime | i18n effort (pt-BR/EN) | Type-safe content | Build speed | Auto-deploy story | Lock-in | Cost | Extends to paid content |
|---|---|---|---|---|---|---|---|---|
| **Astro** | JS/TS (Vite) | Low–moderate (built-in) | Excellent (Content Layer) | Good | Excellent (CF/Netlify/Actions) | Low | Free OSS | Yes (Islands+Actions+SSR) |
| **Hugo** | Go (binary) | Low (mature) | Frontmatter only (no TS types) | Fastest | Excellent (Actions) | Low | Free OSS | Limited (needs separate backend) |
| **Eleventy** | Node/JS | Moderate (plugin) | Manual | Fast | Excellent | Very low | Free OSS | Limited |
| **Zola** | Rust (binary) | Low (built-in) | Frontmatter | Very fast | Good (Actions) | Low | Free OSS | Limited |
| **SvelteKit** | JS/TS (Svelte) | Moderate (Paraglide) | Good (Velite/mdsvex) | Good | Good (adapters) | Moderate | Free OSS | Yes (full-stack) |
| **Next.js** | JS/TS (React) | High (next-intl) | Good (Velite) | Slower | Best on Vercel (commercial $) | Higher | Free OSS; Vercel paid | Yes (best for heavy commerce) |
| **Nuxt** | JS/TS (Vue) | Low (@nuxt/i18n) | Good (Nuxt Content) | Good | Good | Moderate | Free OSS | Yes |
| **Gatsby** | JS/TS (React) | Moderate | GraphQL layer | Slow (historical pain) | OK | Higher | Free OSS | Possible but declining |

**Hosting (free tier → paid; USD→BRL at ~R$5.05/USD, mid-market late May 2026):**

| Host | Free tier | Paid | Commercial on free? |
|---|---|---|---|
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo, 1 concurrent build, 100 domains/project | Workers Paid $5/mo (≈R$25) | Yes |
| **Netlify** | 300 credits/mo (new accts) | Pro ~$19/seat/mo (≈R$96) | Yes |
| **Vercel** | ~100 GB bw, 1M fn invocations | Pro $20/seat/mo (≈R$101) | **No (Hobby bans commercial)** |
| **GitHub Pages** | Free, ~1 GB site limit | — | Yes |

## Recommendations (staged)

**Stage 1 — Launch the content site (now):**
- Build with **Astro** using built-in i18n routing (`/en`, `/pt-br`, `Astro.preferredLocale` for browser-default), Content Collections + Content Layer for type-safe bilingual content (blog, CV, portfolio, events, galleries, downloads), and `<Image>`/sharp for image optimization.
- Host on **Cloudflare Pages** (Git push → build → deploy; unlimited bandwidth; commercial-use-friendly). Wire `rsicarelli.com` DNS to Cloudflare.
- Store heavy talk-photo galleries in **Cloudflare R2** (zero egress) rather than Git/LFS; keep small in-repo images optimized by Astro.
- Add per-locale sitemap + hreflang, an `llms.txt`, and an AI-crawler-friendly `robots.txt`.
- *Benchmark to change course:* if build times exceed a few minutes as content grows, offload image generation to R2/an image CDN or evaluate Hugo for raw speed.

**Stage 2 — Editing ergonomics (optional, when desired):**
- Add **Keystatic** (free, MIT, first-party Astro, TypeScript schema) for a browser editing UI that still commits to GitHub. *Threshold:* adopt only if direct Markdown editing becomes a friction point (e.g., you want to publish from mobile).

**Stage 3 — Paid content/courses (later):**
- Switch the relevant routes to Astro hybrid SSR with the Cloudflare adapter; use **Server Islands** for personalized UI and **Actions** for backend logic.
- Add **Better Auth** (self-hosted, lower lock-in, official Stripe plugin) or **Clerk** (managed, faster) for auth, and **Stripe Checkout** for payments.
- *Threshold to reconsider framework:* only if courses/commerce become the primary product with heavy authenticated, app-like flows — then evaluate Next.js/SvelteKit. For a content site that bolts on a paywall, stay on Astro.

**If you prefer maximum minimalism / raw speed over JS ergonomics:** choose **Hugo** instead of Astro at Stage 1 — superb multilingual support and unbeatable build speed — accepting weaker type-safety and a harder path to in-app paid content (you'd add a separate backend/service).

## Key risks & trade-offs
- **Astro governance:** Cloudflare's January 2026 acquisition is a momentum positive but concentrates stewardship; watch for Cloudflare-leaning defaults. Astro remains MIT/open-governance/multi-deploy for now.
- **Keystatic maturity:** Still 0.x ("experimental" per its README), consultancy-backed (not VC/foundation), and the Astro adapter updates less frequently than the core. Low risk for a solo site but monitor maintenance.
- **Image build times:** Heavy galleries can slow Node-based builds — mitigate with external CDN/R2 and capped concurrency.
- **Vercel commercial restriction:** Don't anchor on Vercel's free tier if courses are coming — Hobby bans commercial use.
- **`llms.txt` uncertainty:** Real but unproven; treat as a cheap hedge, not a strategy. Content quality and clean HTML drive AI citations.
- **i18n if you pick Next.js:** Materially higher effort and breakage risk than Astro/Hugo.
- **Currency note:** USD→BRL is volatile (ranged roughly R$4.89–R$5.52 across 2026; ~R$5.05 mid-market late May 2026). BRL figures above are approximate and will drift.

## Decision framework
- **Priority = best content DX + type safety + easy bilingual + clean path to future paid content (most likely you):** → **Astro on Cloudflare Pages.**
- **Priority = raw build speed at large scale + minimal JS + rock-solid multilingual, willing to forgo TS content types and in-app commerce:** → **Hugo on Cloudflare Pages.**
- **Priority = maximal control / minimal abstraction, small site:** → **Eleventy.**
- **Priority = you'll live in Svelte and may grow app-like features:** → **SvelteKit + Paraglide.**
- **Priority = the site is really a course/SaaS product first, content second:** → **Next.js (accept i18n pain) or SvelteKit.**
- **Avoid for new builds:** Gatsby (build pain, declining), Contentlayer (abandoned), and Vercel Hobby for any commercial use.

---
*Sources include: Astro official docs & blog (i18n, Content Layer, Actions, Server Islands, e-commerce, authentication, "2024 year in review," "joining Cloudflare"); Cloudflare press release (Jan 16, 2026) and 2025 Radar Year in Review (Dec 15, 2025); State of JavaScript 2024 and 2025 (Devographics); Aggarwal et al., "GEO: Generative Engine Optimization" (KDD 2024, arXiv:2311.09735); Hugo multilingual docs; Next.js docs & next-intl docs; inlang/Paraglide docs; Keystatic GitHub/npm + Thinkmill statements; Lucky Media CMS reviews; Git LFS docs and GitHub community guidance; Cloudflare/Netlify/Vercel pricing analyses (2026); exchange-rate sources (Bloomberg, Wise, exchange-rates.org, TradingEconomics, May 2026). Where figures originate from vendor marketing (e.g., Paraglide's "~70% smaller bundles," build-speed benchmarks), they are flagged as such and should be validated for your own content volume.*