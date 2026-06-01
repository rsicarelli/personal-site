# Web Architecture Landscape Report (2025–2026): Choosing a Coherent End-to-End Stack for rsicarelli.com

## TL;DR
- **For a bilingual (pt-BR/EN), git-as-CMS, performance/SEO/GEO-first personal hub with a future paid-content path, the strongest coherent default is Astro + Keystatic + Cloudflare Pages**, with Tailwind/shadcn for UI and Cloudflare Web Analytics (or Plausible) — Astro ships zero-JS HTML that crawlers and LLMs read cleanly, has first-class built-in i18n with browser-locale detection, and Cloudflare's free tier has unlimited bandwidth. (Cloudflare *acquired* The Astro Technology Company on Jan 16, 2026, deepening this synergy; Astro remains open-source.)
- **Two credible alternatives:** (B) **Next.js + Content Collections/Keystatic on Vercel** if you want the largest ecosystem and richest dynamic/payment surface in one framework, at higher JS weight and real lock-in to Vercel pricing; and (C) **Hugo (or Eleventy) + Decap/Sveltia on GitHub Pages/Cloudflare** for a maximally cheap, fast, dependency-light pure-static build.
- **The single biggest cross-cutting decision is payments:** because the user is in São Paulo selling to Brazilians who pay with **Pix**, the global merchant-of-record tools mostly do NOT solve Brazil. Only **Paddle** (among MoRs) supports Pix; **Polar and Lemon Squeezy do not**. The simplest Brazil-native path is **Hotmart/Kiwify or Mercado Pago** (native Pix), or **Stripe** (Pix at 1.19%, but you handle your own tax). This choice is *decoupled* from the website framework, so none of the stacks below lock you out of it.

## Key Findings

1. **Rendering approach matters most for SEO/GEO.** Server-rendered or statically-generated HTML is read cleanly by Google and AI crawlers; client-rendered SPAs are a liability. This favors SSG/islands frameworks (Astro, Hugo, Eleventy) and SSR-capable ones (Next, Nuxt, SvelteKit) over pure client-rendered approaches. Notably, this is also the **biggest weakness of the Kotlin option (Kobweb)**: it exports static snapshots that then *hydrate* as a Compose HTML single-page app, which is workable but not the cleanest crawler/LLM story, and it is **pre-1.0** with a tiny team.

2. **Astro is the content-site sweet spot and just got a major backer.** Cloudflare announced its acquisition of The Astro Technology Company on Jan 16, 2026. Per Cloudflare's own press release, Matthew Prince (co-founder/CEO) said: *"By acquiring this talented team and committing to one of the most impactful frameworks…we're going to ensure Astro continues to be the best web framework for content-driven websites."* Astro CEO Fred Schott emphasized portability: *"Astro will continue to be the best way for developers to build content-driven websites, whether they host on Cloudflare or elsewhere."* Astro remains open-source, and Astro 6 beta added first-class Cloudflare Workers support. Built-in i18n (since v4, stable in v5+) handles URL prefixing, `Astro.currentLocale`, browser-language detection (`Astro.preferredLocale`), and automatic hreflang.

3. **"Git as CMS" is a solved problem with several free, open-source layers.** Keystatic (MIT, first-party Astro/Next integration, TypeScript schema, GitHub mode free) is the best-fit editor layer; Sveltia CMS (modern Decap rewrite, first-class i18n) and Decap are framework-agnostic alternatives; TinaCMS adds visual editing but more overhead. Or skip a CMS entirely and edit Markdown/MDX in content collections — viable for an expert engineer.

4. **Cloudflare Pages has the most generous free tier** — per Cloudflare's own docs: unlimited bandwidth, 500 builds/month, 1 concurrent build, 100 custom domains per project, 20,000 files/site, and *"requests to static assets are free and unlimited,"* with commercial use allowed. This de-risks the "viral post" scenario. Vercel's Hobby tier prohibits commercial use and meters bandwidth; Netlify moved to a credit system (Sep 2025).

5. **llms.txt is low-cost, contested-value hygiene.** Worth publishing, but the real GEO wins come from server-rendered HTML, structured data (JSON-LD), and traditional SEO authority. Google's John Mueller was blunt in 2025: *"AFAIK none of the AI services have said they're using LLMs.txt (and you can tell when you look at your server logs that they don't even check for it). To me, it's comparable to the keywords meta tag."* At Google Search Central Live July 2025, Gary Illyes similarly stated Google doesn't support llms.txt and isn't planning to. (Anthropic and Perplexity have signaled support, so it retains low-downside, positive expected value.)

6. **Privacy analytics are cheap or free.** Cloudflare Web Analytics is free and adequate for a personal site; Plausible/Umami/GoatCounter are open-source with both cloud and self-host paths.

7. **Payments are forward-compatible from any stack** because checkout is an external integration (hosted checkout link, redirect, or embedded), not a framework feature. The real constraint is Brazil/Pix, not the website.

## Details

### Dimension 1 — Web technology & rendering approach

| Option | What it is | Best for | Maturity/Momentum | Lock-in |
|---|---|---|---|---|
| **Astro** | Content-first, islands architecture, zero-JS by default, SSR optional | Blogs, portfolios, docs, marketing | Very high; Cloudflare-acquired Jan 2026, Astro 6 beta | Low (plain HTML, BYO UI framework) |
| **Next.js** | React full-stack, SSR/SSG/ISR, App Router, RSC | Apps, dashboards, large dynamic sites | Highest ecosystem; Next 16, Turbopack stable | Medium-high (Vercel-optimized; React) |
| **Nuxt** | Vue full-stack, Nitro engine | Vue teams, hybrid sites | High | Medium |
| **SvelteKit** | Compile-time, smallest bundles, Svelte 5 runes | Performance-focused apps | High and rising | Medium |
| **Hugo** | Go static generator, fastest builds, i18n built-in | Large content sites, blogs | Very mature, stable | Low (Go templates) |
| **Eleventy (11ty)** | JS static generator, zero client JS, flexible | Simple/flexible blogs | Mature, steady | Very low |
| **Gatsby** | React SSG w/ GraphQL | Legacy React content sites | **Declining — Netlify acquired 2023, active development paused**; avoid for new builds | High (GraphQL) |
| **Remix / React Router v7** | Web-standards SSR; Remix merging into RR v7 | Server-rendered React apps | In transition | Medium |
| **Qwik** | Resumability, near-zero JS hydration | Cutting-edge performance | Niche, smaller community | Medium |
| **Docusaurus** | React, docs-focused, i18n + versioning | Documentation sites | Mature (Meta) | Medium |
| **Kobweb (Kotlin/Compose HTML)** | Kotlin web framework, Next.js-inspired, Markdown support, static export | Kotlin devs building sites | **Pre-1.0, tiny team**; functional but expect API churn | High (niche ecosystem) |
| **Zola (Rust)** | Single-binary Rust SSG, Tera templates, built-in search | Fast dependency-free static sites | Mature, smaller community | Low |
| **Leptos (Rust)** | Rust reactive full-stack (WASM) | Rust devs building apps | Emerging, app-focused not content | High |

**Verdict:** For this content-hub use case, Astro, Hugo, and Eleventy are the rendering sweet spot. Kobweb is a tempting "write my site in Kotlin" option given the user's expertise and KotlinConf 2025 Kobweb talk visibility, but its pre-1.0 status, hydration-based output, and immature i18n/SEO tooling make it a higher-risk choice for a flagship personal brand site where SEO/GEO are first-class.

### Dimension 2 — Git as CMS + auto-deploy

The pattern: content (Markdown/MDX/JSON/YAML) lives in the GitHub repo; a push triggers a platform-native build that auto-deploys. No manual deploy step. Optionally, a git-based CMS provides a web UI that commits to the repo.

- **Keystatic** (MIT, free): first-party Astro/Next/Remix integrations, TypeScript schema, local mode (edits disk) + GitHub mode (commits via GitHub API; free with manual OAuth app, or Keystatic Cloud Free tier up to 3 users). **Caveat: no native i18n/localization layer** — you handle bilingual content via per-locale collections or repeated fields.
- **Sveltia CMS** (free, open source): modern Svelte rewrite of Decap, drop-in Decap replacement, first-class i18n, mobile-friendly, passwordless sign-in. Strong fit for a bilingual site.
- **Decap CMS** (free): the established framework-agnostic option, but development slowed after Netlify handed it to the community; YAML config, broad backend support.
- **TinaCMS**: visual click-to-edit, but Tina Cloud SaaS dependency and more setup; Astro support experimental.
- **Contentlayer: effectively stalled/unmaintained** — do not anchor a new build on it.
- **No CMS**: For an expert engineer who "will personally own and edit the repository," editing MDX directly in content collections is entirely viable and lowest-overhead.

**Auto-deploy** is handled either by GitHub Actions (full control) or platform-native git integration (Cloudflare Pages, Vercel, Netlify all auto-build on push — zero config).

### Dimension 3 — Hosting & delivery (costs in USD + approximate BRL at ~R$5.0–5.2/USD, the prevailing 2026 range)

| Platform | Free tier | Paid entry | Notes |
|---|---|---|---|
| **Cloudflare Pages** | Unlimited bandwidth, 500 builds/mo, 1 concurrent build, 100 custom domains/project, commercial use OK; Workers 100k req/day | Pro $5/mo (~R$26) → 5,000 builds, 10M Workers req/mo | Best free tier; 300+ edge locations; static assets always free/unlimited |
| **GitHub Pages** | Free, 100GB soft bandwidth, 10 builds/hr | n/a | Pure static only; no SSR; native to "repo as source of truth" |
| **Vercel** | Hobby: 100GB, 1M edge requests, **non-commercial only** | Pro $20/user/mo (~R$104) | Best Next.js DX; metered bandwidth; per-seat |
| **Netlify** | 300 credits/mo (credit system since Sep 2025) | $19/mo (~R$98) flat per team | Commercial use OK on free; forms/identity built in |
| **Render** | Free web service (512MB, cold starts), free Postgres | from ~$7/mo | Good for full-stack/backends |
| **Deno Deploy** | Generous free edge tier | usage-based | Good for edge functions/TS |

**Verdict:** Cloudflare Pages is the clear cost/performance winner for this profile; GitHub Pages is the absolute-cheapest pure-static fallback that most literally embodies "repo as source of truth."

### Dimension 4 — Bilingual (pt-BR/EN) architecture

- **Routing strategy:** subpath (`/pt/`, `/en/`) is the recommended default — works with static hosting, simplest, SEO-clean. Subdomains and ccTLDs add DNS/setup overhead with marginal benefit for a personal site.
- **Browser-locale defaulting:** Astro exposes `Astro.preferredLocale` / `Astro.preferredLocaleList` from `Accept-Language` for on-demand rendered pages; for fully static output, do locale detection with a small edge function (Cloudflare) or client-side redirect on the root. Hugo and Eleventy have i18n but rely on build-time generation + edge/JS for browser detection.
- **hreflang + sitemap:** Astro's `@astrojs/sitemap` auto-generates per-language sitemaps; add `<link rel="alternate" hreflang>` tags (including `x-default`). All frameworks support this; Astro/Next make it most ergonomic.
- **Translation strings:** Astro's built-in i18n is routing-only — you add a tiny `t()` helper with per-locale JSON (or use paraglide/astro-i18n/i18next). Next has next-intl/next-i18next; Hugo has native i18n dictionaries.

### Dimension 5 — SEO (Google) + GEO/AEO (AI engines)

- **Server-rendered HTML is the foundation** for both Google and LLM crawlers (ChatGPT/GPTBot, ClaudeBot, PerplexityBot, Gemini). Static/SSG output wins here.
- **Structured data (JSON-LD):** Google's recommended format. Use `Person` (author/CV), `BlogPosting`/`Article` (posts), `Organization`, `Event` (upcoming talks), `FAQPage`, `BreadcrumbList`. Improves rich results and LLM extraction accuracy (though not a guaranteed citation or direct ranking factor).
- **Sitemaps & robots.txt:** auto-generate sitemaps; configure robots.txt for AI crawler tokens (GPTBot, ClaudeBot, Google-Extended, PerplexityBot) — allow or disallow per preference.
- **llms.txt:** emerging, contested. Anthropic and Perplexity have signaled support; Google's John Mueller said no Google system uses it (*"comparable to the keywords meta tag"*). Cheap to publish (a curated Markdown index of your best pages) — positive expected value, low downside, but not a substitute for fundamentals.
- **GEO reality check:** AI citations correlate with traditional SEO authority and third-party mentions; ChatGPT citations track Bing results closely.

### Dimension 6 — Privacy-friendly analytics

| Tool | Free/self-host | Cloud cost | Notes |
|---|---|---|---|
| **Cloudflare Web Analytics** | Free, unlimited | Free | Cookieless, no banner; basic (pageviews, top pages/referrers); 30-day retention, ~10% sampling, capped reports. Perfect "is anyone visiting?" tool, especially if already on Cloudflare |
| **Plausible** | Self-host free (AGPL, ClickHouse) | Cloud from $9/mo (~R$47) @10k pv | Polished; GSC integration; EU-hosted; bot filtering is cloud-only |
| **Umami** | Self-host free (MIT, Postgres) | Cloud free ≤1M events/mo | Lightweight; good middle ground; ~2KB script |
| **GoatCounter** | Self-host free (single Go binary) | Free non-commercial | Minimalist; no Docker needed; $15/mo commercial |
| **Fathom** | — | ~$15/mo | Paid, polished, privacy-first |
| **PostHog** | Self-host/cloud free tier | usage-based | Product analytics (funnels, flags); heavier ~52KB script |
| **Matomo** | Self-host free (PHP/MySQL) | cloud paid | Most full-featured; heaviest to operate |

**Verdict:** Start with **Cloudflare Web Analytics** (free, zero-effort if on Cloudflare Pages). Graduate to **Umami** (self-host, free) or **Plausible** (cloud $9/mo) if you want goals/events/retention.

### Dimension 7 — Forward-compatible path to selling paid content (the Brazil-critical dimension)

The website does NOT lock you in: paid content is added later via hosted checkout, gated routes, or an embedded widget. The decisive constraint is **Brazil + Pix + tax (nota fiscal)**.

| Platform | Fee | Merchant of Record? | Pix? | Tax/nota fiscal |
|---|---|---|---|---|
| **Polar.sh** | 4%+40¢ (Early Member, orgs before May 27 2026) / **5%+50¢ for new orgs created on/after May 27 2026**; +1.5% intl. Paid tiers: Pro $20/mo (3.8%+40¢), Growth $100/mo (3.6%+35¢), Scale $400/mo (3.4%+30¢) | Yes | **No** | Handled (VAT/sales tax) |
| **Lemon Squeezy** | 5%+50¢; +1.5% intl | Yes | **No** (long-standing unfulfilled feature request) | Handled |
| **Paddle** | 5%+$0.50 | Yes | **Yes** (BRL, one-time; added 2025 — *"In LATAM, Pix is available, meaning faster and easier access for customers in Brazil"*; no Brazil entity required) | Handled |
| **Stripe (Brazil)** | 3.99%+R$0.39 cards; **Pix 1.19% per paid Pix** (Stripe's own pricing page) | **No** (you handle tax) | **Yes** (Pix invite-only for BR businesses; IOF 3.5% on cross-border, collected via Ebanx) | Seller's responsibility |
| **Hotmart** | ~9.9%+R$1 | No (intermediary) | **Yes** | Producer issues NFS-e |
| **Kiwify** | 8.99%+R$2.49 (Pix 0% fee, instant settlement) | No (intermediary) | **Yes** | Producer issues NFS-e |
| **Mercado Pago** | Pix 0% (0.49% if CNPJ >R$15k/mo) | No (intermediary) | **Yes** | Producer issues NFS-e |

**Key strategic insight:** If the buyers are primarily Brazilian, a **Brazilian-native course platform (Hotmart/Kiwify)** or **Mercado Pago** is the path of least resistance — native Pix, low/zero Pix fees, instant settlement — but you must issue your own nota fiscal (ideally via a CNPJ under Simples Nacional for ~6% tax vs up to ~27.5% as pessoa física). If buyers are global/USD, an MoR (**Paddle** if Pix matters, else Lemon Squeezy/Polar) offloads worldwide tax compliance. The website should simply link/redirect to whichever checkout you choose — keep content gating logic minimal until you commit.

### Dimension 8 — Design/UI system fit

- **Tailwind CSS** (v4 stable): works with every framework; utility-first, themeable via tokens, excellent for a solo expert. Recommended baseline.
- **shadcn/ui**: copy-paste React components on Radix primitives (accessible, WAI-ARIA), Tailwind-styled. Works in Astro **via React islands** — fine for the few interactive bits (theme toggle, dialogs, language switcher) but pulls React into an otherwise zero-JS Astro site. Use sparingly.
- **Framework constraint:** Astro lets you mix React/Vue/Svelte/Solid; shadcn requires React. Hugo/Eleventy/Zola → vanilla CSS/Tailwind + web components (no React component libraries). Next/SvelteKit → native to their respective component models. Kobweb → Kotlin/Compose HTML "Silk" component set with built-in light/dark.
- **Dark mode & a11y:** all options support dark mode; shadcn/Radix gives strong a11y defaults. For pure-static (Hugo/Eleventy) you implement dark mode with CSS + a small script.

## Reference Stacks

### Stack A — "Astro Content Hub" (RECOMMENDED DEFAULT)
- **Rendering:** Astro (SSG + islands), Astro built-in i18n
- **Content/CMS:** Markdown/MDX content collections + **Keystatic** (GitHub mode, free) as optional UI; bilingual via per-locale collections
- **Hosting:** Cloudflare Pages (free, unlimited bandwidth, auto-deploy on push)
- **i18n:** subpath routing, `Astro.preferredLocale` + edge redirect for browser default, auto hreflang/sitemap
- **SEO/GEO:** static HTML, JSON-LD (Person/BlogPosting/Event), sitemap, robots.txt, llms.txt
- **Analytics:** Cloudflare Web Analytics (free) → Umami later
- **Payments (later):** external — Hotmart/Kiwify/Mercado Pago (BR audience) or Paddle (global); link out from a gated page
- **UI:** Tailwind v4 + minimal shadcn React islands; dark mode
- **Monthly cost:** **$0** (~R$0) until paid content; analytics/CMS free. Optional Plausible $9 (~R$47).
- **Effort to launch:** Low–moderate (1–2 weekends for an expert)
- **Best for:** Exactly this user — content-first bilingual personal hub, SEO/GEO-critical, free, future-proof.

### Stack B — "Next.js Full-Stack"
- **Rendering:** Next.js (App Router, SSG/SSR/ISR), next-intl
- **Content/CMS:** MDX + Content Collections or Keystatic; or Velite-style local content
- **Hosting:** Vercel (Pro $20/mo once commercial/paid content) or Cloudflare via @opennextjs/cloudflare
- **i18n:** next-intl, middleware-based locale detection (excellent browser defaulting)
- **SEO/GEO:** strong, but watch client-component hydration; keep content pages server-rendered
- **Analytics:** Vercel Analytics or Plausible/Umami
- **Payments (later):** richest integration surface (Stripe SDK, embedded checkouts, gated APIs) — best if building a real custom course platform
- **UI:** Tailwind + shadcn/ui native (React)
- **Monthly cost:** $0 on Hobby for non-commercial; **$20/mo (~R$104)** once selling/commercial on Vercel
- **Effort to launch:** Moderate
- **Best for:** Someone who wants one framework to grow into a full app with custom auth + payments, and accepts more JS + Vercel cost/lock-in.

### Stack C — "Pure Static, Maximally Cheap & Durable"
- **Rendering:** Hugo (or Eleventy) — fastest builds, native i18n, zero client JS
- **Content/CMS:** Markdown + **Sveltia CMS** (first-class i18n) or Decap; or raw Markdown
- **Hosting:** GitHub Pages or Cloudflare Pages (free); GitHub Actions auto-deploy
- **i18n:** Hugo native multilingual; subpath routing; browser default via tiny edge/JS redirect
- **SEO/GEO:** excellent (pre-rendered HTML, great Core Web Vitals); JSON-LD via templates
- **Analytics:** Cloudflare Web Analytics or GoatCounter
- **Payments (later):** external link-out (same Brazil logic)
- **UI:** vanilla CSS or Tailwind; no React component libs
- **Monthly cost:** **$0 (~R$0)**
- **Effort to launch:** Low (Hugo) but template-language learning curve; less "componenty"
- **Best for:** Minimal dependencies, maximum longevity/speed, no Node toolchain anxiety.

### Stack D — "Kotlin-Native" (Kobweb) — for ideological/portfolio reasons
- **Rendering:** Kobweb (Compose HTML), static export + hydration
- **Content/CMS:** Markdown support in Kobweb; raw repo editing (no mature CMS UI)
- **Hosting:** GitHub Pages/Netlify/Cloudflare (static export); GitHub Actions
- **i18n:** **DIY** — no first-class bilingual story; significant custom work
- **SEO/GEO:** workable (real HTML export) but hydration SPA model is not the cleanest; smallest ecosystem for SEO tooling
- **Analytics:** Cloudflare Web Analytics
- **Payments (later):** external link-out
- **UI:** Kobweb Silk (Kotlin), Compose-style, light/dark built in
- **Monthly cost:** $0 (~R$0)
- **Effort to launch:** **High** — pre-1.0 churn, build-it-yourself i18n/SEO, you are partly your own framework support
- **Best for:** A Kotlin expert who values dogfooding/"my site is in Kotlin" as a portfolio statement and accepts the SEO/i18n/maturity tradeoffs. Given this user is a Kobweb conference speaker and KMP-program member, this has real brand-narrative appeal — but it is the riskiest choice against the stated firm constraints (bilingual + SEO/GEO first-class).

## Weighted Decision Matrix

Weights reflect the stated firm constraints (bilingual, git-as-CMS auto-deploy, performance/SEO/GEO, cost, plus extensibility and ergonomics). Scores 1–5 (5 best).

| Criterion (weight) | A: Astro/CF | B: Next/Vercel | C: Hugo/Pages | D: Kobweb |
|---|---|---|---|---|
| Developer ergonomics (15%) | 4 | 4 | 3 | 4* (Kotlin-native for this user) |
| Performance (15%) | 5 | 3 | 5 | 3 |
| SEO + GEO (20%) | 5 | 4 | 5 | 3 |
| Bilingual support (15%) | 5 | 5 | 4 | 2 |
| Auto-deploy simplicity (10%) | 5 | 5 | 4 | 4 |
| Extensibility to payments (10%) | 4 | 5 | 3 | 3 |
| Cost (10%) | 5 | 3 | 5 | 5 |
| Lock-in (low = better) (5%) | 4 | 2 | 5 | 3 |
| **Weighted total** | **4.70** | **3.95** | **4.35** | **3.10** |

\*Ergonomics is user-relative: Kobweb scores higher for this specific Kotlin-expert user than it would generally.

## Final Comparison Table

| | A: Astro + Keystatic + Cloudflare | B: Next.js + Vercel | C: Hugo/Eleventy + GitHub/CF Pages | D: Kobweb (Kotlin) |
|---|---|---|---|---|
| Rendering | SSG + islands | SSR/SSG/ISR | Pure SSG | Static export + hydration |
| Bilingual | Built-in i18n, easy | next-intl, excellent | Native i18n, good | DIY, weak |
| Git-as-CMS | Keystatic/MDX | Keystatic/MDX | Sveltia/Decap/MD | Raw repo |
| Hosting cost/mo | $0 | $0→$20 | $0 | $0 |
| SEO/GEO | Excellent | Very good | Excellent | Fair |
| Payments path | External | External or native | External | External |
| UI system | Tailwind + React islands | Tailwind + shadcn | Tailwind/vanilla | Kotlin Silk |
| Maturity | Very high | Highest | Very high | Pre-1.0 |
| Biggest risk | React islands creep / Cloudflare consolidation | Vercel cost + lock-in + JS weight | Template-lang limits, less componentry | Maturity, i18n/SEO gaps, support |
| Effort | Low–moderate | Moderate | Low | High |

## Shortlist (Top Candidates)
1. **Stack A — Astro + Keystatic + Cloudflare Pages (primary recommendation).** Best balance across every firm constraint: free, fastest SEO/GEO posture, built-in bilingual, trivial auto-deploy, and Astro's new Cloudflare backing reduces longevity risk.
2. **Stack C — Hugo/Eleventy + GitHub/Cloudflare Pages (durability pick).** If you want minimal dependencies and maximum longevity over component ergonomics.
3. **Stack B — Next.js + Vercel (if payments/app ambitions grow).** Choose only if you expect to build a genuine custom course platform with auth and embedded billing inside the same app.
4. **Stack D — Kobweb (brand-narrative wildcard).** Worth a proof-of-concept given the user's Kotlin/Kobweb visibility, but not recommended as the production stack for a SEO/GEO/bilingual-critical flagship.

## Explicit Trade-offs & Single Biggest Risk
- **A:** Trade-off — adding interactive React (shadcn) creeps JS into a zero-JS site. **Biggest risk:** over-reliance on the Cloudflare ecosystem now that Cloudflare owns both Astro and your host (concentration risk), though Astro stays open-source and portable (per Astro CEO's own statement).
- **B:** Trade-off — more JS, per-seat Vercel cost once commercial. **Biggest risk:** Vercel pricing/lock-in and accidental client-rendering hurting GEO.
- **C:** Trade-off — template languages and less component reuse. **Biggest risk:** friction as the site grows more interactive (paid content UI).
- **D:** Trade-off — bleeding-edge Kotlin web vs. proven tooling. **Biggest risk:** pre-1.0 instability + DIY i18n/SEO undermining the site's core goals.

## Decision Framework (which choice fits which priorities)
- **"I want the best all-around fit for my stated goals, free, now" → Stack A.**
- **"I value 10-year durability and minimal dependencies above all" → Stack C.**
- **"I will build a real custom paid-course app with auth/billing in-house" → Stack B.**
- **"I want my site to be a Kotlin showcase and accept the risks" → Stack D (POC first).**
- **Payments sub-decision:** Brazilian audience → Hotmart/Kiwify/Mercado Pago (native Pix) + open a CNPJ for tax efficiency. Global audience → Paddle (if Pix needed) or Lemon Squeezy/Polar (MoR convenience). Maximum control + lowest fee, willing to handle tax → Stripe (Pix 1.19%).

## Recommended Sequence of Deeper Research Next
1. **Astro i18n + Keystatic bilingual content modeling** — prototype per-locale collections and confirm the editor UX for two languages (Keystatic has no native i18n layer).
2. **Cloudflare Pages + edge locale-detection redirect** — validate browser-`Accept-Language` defaulting on fully static output.
3. **JSON-LD + llms.txt implementation patterns for Astro** — `Person`/`Event`/`BlogPosting` schemas and an automated llms.txt.
4. **Brazil payments deep-dive** — CNPJ/Simples Nacional setup, nota fiscal automation (e.g., NFS-e tools), and a head-to-head of Hotmart vs Kiwify vs Mercado Pago checkout UX for course sales; verify current fees at signup.
5. **Gated-content architecture** — how to add paid content later without re-platforming (hosted checkout + signed-URL/download patterns or membership area).
6. **Kobweb POC (optional)** — time-box a bilingual Kobweb prototype to objectively measure the SEO/i18n gap before deciding.

## Caveats
- **Currency:** USD→BRL fluctuated in the ~R$4.9–5.5 range in 2026 (averaging ~R$5.17); BRL figures are approximate at ~R$5.0–5.2/USD and will drift.
- **Pricing volatility:** Hosting and payment fees change frequently; Polar's fee tier changed via a May 20, 2026 announcement (new orgs created on/after May 27, 2026 pay 5%+50¢; earlier orgs keep 4%+40¢), Netlify moved to credits (Sep 2025), Vercel meters aggressively. Verify at signup.
- **Brazil platform fees** for Hotmart/Kiwify are widely-reported figures from accounting/reseller sources, not always single headline numbers on official pages; confirm current rates and plan tiers directly.
- **llms.txt and GEO** are fast-moving and contested; treat AI-discoverability tactics as experimental and measure rather than assume.
- **Kobweb** is pre-1.0; any assessment here may be outdated within months as the framework matures.
- **Cloudflare–Astro acquisition** (Jan 16, 2026) is recent; long-term governance/roadmap effects are still unfolding, though both companies state Astro remains open-source and host-portable.