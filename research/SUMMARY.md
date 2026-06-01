# rsicarelli.com — Research Summary

A consolidated, scan-first digest of the deep-research reports in this folder (prompts 01–07).
Payments (08) is intentionally deferred — it's decoupled from the build and can be attached later.

> **Convergence is unusually strong.** All seven independent reports point at the *same* stack.
> Where they disagree, it's only on optional add-ons (which CMS UI, which analytics host), never
> on the core. Read the "Unified recommended stack" first; the per-topic digests below back it up.

---

## ⭐ Unified recommended stack (what every report converges on)

| Layer | Recommendation | Cost |
|-------|----------------|------|
| **Framework** | **Astro** (SSG + islands, zero-JS by default), Content Layer API + Zod schemas | Free / OSS |
| **Hosting** | **Cloudflare Pages** (native git auto-deploy from GitHub; PR previews) | **$0/mo** (unlimited bandwidth) |
| **DNS** | **Cloudflare** as DNS (apex via CNAME flattening + www CNAME, free TLS) | $0 + ~$10.44/yr domain |
| **Email** | **Cloudflare Email Routing** (free receive) + Zoho free / Gmail send-as | $0 |
| **Media (photos, downloads)** | **Cloudflare R2** (zero egress, 10 GB free) — keep heavy assets out of the repo | $0 → $0.015/GB-mo |
| **i18n** | Astro built-in i18n, **subdirectory URLs** `/en/` + `/pt-br/`, browser-locale detect at `/` only | Free |
| **Styling** | **Tailwind CSS v4** (or vanilla CSS + design tokens) + **shadcn/ui** for interactive bits | Free / OSS |
| **Design direction** | "Minimalist editorial + one distinctive accent" (à la leerob.com, brittanychiang.com) | — |
| **Type** | Self-hosted variable woff2 — **Inter** or **IBM Plex Sans** (full pt-BR diacritics) + a mono | Free (OFL) |
| **Analytics** | **Umami** (cookieless, no banner) + **Cloudflare Web Analytics** as free redundant baseline | $0 (free tiers) |
| **CMS editing** | **Optional** — IDE + Front Matter ext is the baseline; add Keystatic/Sveltia only if a GUI is wanted | Free |
| **Total at launch** | | **≈ $0/mo + ~$10/yr domain** |

**One-line story:** Push Markdown/MDX to GitHub → Cloudflare Pages auto-builds an Astro site →
served bilingual, zero-JS, green Core Web Vitals, $0/month, with a clean path to add gated paid
courses later (Astro Server Islands + auth + payments) **without re-platforming**.

### The handful of real decisions still open
- **CMS UI:** none (edit MDX in IDE) vs **Keystatic** (TS schema, weak i18n) vs **Sveltia** (best
  bilingual UX, but 0.x beta, single maintainer). Defer — direct editing works day one.
- **Cloudflare Pages vs Workers Static Assets** as deploy target (both work; Workers is the
  actively-developed path, Pages is in feature-freeze but not shutting down).
- **Outbound email provider:** Zoho free vs Migadu (~$19/yr) vs Fastmail ($5/mo).
- **Payments** (deferred): Brazil/Pix audience → Hotmart/Kiwify/Mercado Pago/Stripe; global → Paddle
  (only MoR with Pix). Decoupled from the framework — no architectural lock-in.
- **Tax/legal** (deferred with payments): pessoa física to start vs MEI/CNPJ before scaling.

### Cross-cutting cautions that appear in multiple reports
- **Never hard-redirect by IP/locale** (301/302) — Googlebot crawls from US IPs with no
  `Accept-Language` and would miss your non-English pages. Detect locale only at `/`, keep a switcher.
- **`llms.txt` is low-value-but-cheap** — Google (Gary Illyes / John Mueller) confirmed no AI system
  currently uses it. Ship it as ~30-min insurance for IDE agents; don't treat it as a strategy.
- **Vercel Hobby & GitHub Pages forbid commercial use** — relevant once courses sell; Cloudflare
  Pages avoids this entirely. (Another reason the stack lands on Cloudflare.)
- **Cloudflare now owns Astro** (acquired Jan 16, 2026) — great synergy, but note the concentration
  (same vendor owns framework + host). Astro stays open-source and host-portable.
- **Avoid Git LFS** for media — small quota, metered CI bandwidth, incompatible with Pages. Go to R2.

---

## 01 — Master Orchestration (End-to-End Stack)

**Bottom line:** Recommends **Astro + Keystatic + Cloudflare Pages** as the coherent default;
runs at **$0/mo** until paid content. Payments are deliberately decoupled (Brazil-specific decision).

**Reference stacks compared:**
- **A — Astro + Keystatic + Cloudflare Pages** → winner (weighted score 4.70). Zero-JS, built-in
  i18n, unlimited free bandwidth, Cloudflare-backed.
- **B — Next.js + Vercel** → richest ecosystem/dynamic surface, but heavier JS, $20/mo once
  commercial, Vercel lock-in.
- **C — Hugo/Eleventy + GitHub/Cloudflare Pages** → maximum durability, zero deps, but less
  componentized / weaker interactive UX.
- **D — Kobweb (Kotlin)** → great brand narrative for a Kotlin expert, but pre-1.0, DIY i18n/SEO,
  highest effort, worst score (3.10). Report suggests a *time-boxed POC* before fully ruling out.

**Costs:** Hosting $0 (~R$0) indefinitely on Cloudflare free tier; Pages Pro if ever needed $5/mo
(~R$26); Plausible cloud upgrade $9/mo (~R$47); Next/Vercel alternative $20/mo (~R$104).

**Risks/caveats:** React islands (shadcn) creep JS weight into an otherwise zero-JS site;
Cloudflare owns both framework + host (concentration); verify all platform fees at signup.

**Settled vs open:** *Settled* — Cloudflare Pages host, Astro framework, Tailwind v4 baseline,
subpath routing. *Open* — whether to add a CMS UI at all; payments platform; CNPJ/nota fiscal setup;
optional Kobweb POC.

---

## 02 — Technology & Architecture

**Bottom line:** SSG + islands is the right rendering model (clean HTML for crawlers + AI bots).
**Astro on Cloudflare Pages** is the front-runner; leaves a viable path to paid courses without
re-platforming.

**Options surveyed:**
- **Astro** — islands/SSG, built-in i18n, Content Layer; #1 satisfaction (State of JS 2025);
  Cloudflare-acquired Jan 2026. **Recommended.**
- **Hugo** — Go binary, sub-second builds (~0.4s/10k pages), mature multilingual, no TS types.
  **Best minimalist alternative.**
- **Eleventy** — Node, zero-JS, max control, i18n via plugin. **Good for minimal abstraction.**
- **Zola** — Rust binary, fast, thin ecosystem. **Niche.**
- **SvelteKit** — compiler-based, Paraglide i18n, full-stack capable. **Strong if Svelte preferred.**
- **Next.js** — dominant by usage but App Router i18n is painful (needs next-intl + middleware),
  satisfaction down to 55%, Hobby bans commercial use. **Over-engineered unless courses are the product.**
- **Nuxt** — good i18n, but Nuxt 3 EOL July 31, 2026. **Vue-only.**
- **Gatsby** — slow builds, declining. **Avoid.**

**Recommended:** Astro + SSG/islands + Content Collections + built-in i18n → Cloudflare Pages.
Optional Keystatic (MIT) as a git-committing browser editor. Paid courses later via Astro Server
Islands + Actions + Cloudflare adapter.

**Costs/effort:** Cloudflare Pages free (500 builds/mo, unlimited bandwidth); Workers Paid $5/mo
unlocks 5,000 builds/mo. Build times fine for hundreds of posts; heavy image galleries can slow
Node builds → offload to R2.

**Risks:** Cloudflare/Astro governance concentration; Keystatic still 0.x ("experimental");
heavy galleries can time out builds; `llms.txt` unproven; don't anchor on Vercel Hobby.

**Reconsider framework only if** courses/commerce become the *primary* product with app-like flows
→ then evaluate Next.js or SvelteKit.

---

## 03 — Hosting, Deploy, DNS & Cost

**Bottom line:** **Cloudflare Pages** (→ Workers Static Assets) is the clear winner — unlimited free
bandwidth, **no egress fees**, best Brazil edge (GRU/GIG). Keep DNS at Cloudflare for portability.
Launch cost ≈ **$0/mo + ~$10.44/yr** (~R$53) domain renewal.

**Options surveyed:**
- **Cloudflare Pages/Workers** → winner; unlimited free bandwidth, no egress, best LATAM edge,
  commercial use OK.
- **Vercel** → great DX but $0.15/GB overage (Pro $20/seat/mo), Hobby non-commercial, 100 GB cap.
- **Netlify** → ~$0.55/GB overage (priciest major), unpredictable credit model, no BR POP.
- **GitHub Pages** → free, zero lock-in, but 100 GB soft cap and **no commercial/e-commerce use**.
- **Render** → better as dynamic backend; free tier sleeps after 15 min idle.
- **Fly.io** → containers, no free tier for new users, egress fees; overkill for static.
- **R2** → zero-egress object storage (10 GB free) — essential companion for galleries/downloads.
- **Backblaze B2** → cheapest archival (~$6/TB-mo), free egress via Cloudflare.

**DNS wiring for rsicarelli.com:**
- Delegate nameservers to Cloudflare (full zone — needed for apex CNAME flattening).
- **Apex** `rsicarelli.com` → flattened CNAME → `<site>.pages.dev`.
- **www** → CNAME → `<site>.pages.dev` (add both apex + www in Pages dashboard).
- **TLS** → free Universal SSL auto-issues (15 min–24 h), covers apex + www.
- **Email DNS** → MX + SPF auto-added by Email Routing; add DKIM from sender; one combined SPF;
  DMARC TXT `p=none`; keep email records DNS-only (grey cloud, unproxied).

**Costs:** Hosting $0; domain ~$10.44/yr (~R$53); Email Routing $0; Zoho free mailbox $0 (no IMAP);
R2 $0 ≤10 GB; dynamic backend later $5/mo (Workers paid).

**Risks:** Pages is in feature-freeze (Workers Static Assets is the live path; Pages not shutting
down); Gmail send-as signs as gmail.com (strict receivers may flag → use Zoho); verify all 2025/26
pricing at signup; BRL volatile.

---

## 04 — Content Architecture & Repo Organization

**Bottom line:** Astro 5 (Content Layer + Zod) with the **GitHub repo as source of truth**. Optional
git-CMS (Keystatic/Sveltia) only if a GUI is wanted — baseline is **IDE + Front Matter VS Code ext**.
Talk photos & large downloads → **Cloudflare R2**; **avoid Git LFS entirely**.

**Recommended folder structure:**
```
src/content/
  blog/<slug>/{index.pt.mdx, index.en.mdx, cover.jpg}
  portfolio/<slug>/{index.pt.mdx, index.en.mdx}
  events/<slug>/{index.pt.mdx, index.en.mdx}
  cv/cv.pt.yaml, cv/cv.en.yaml
  pages/{contact,about}/…
```
Per-collection + per-locale + page-bundle hybrid; post images co-locate in the bundle, gallery/
download assets go external (R2).

**Bilingual organization:** Parallel suffix files (`post.pt.mdx`/`post.en.mdx`) or locale folders.
Keep locales in sync via (1) Zod schema making per-locale entries required → missing translations
become build errors/visible fallbacks; (2) per-locale sitemaps + hreflang; (3) a GitHub Actions cron
that diffs slug sets per locale and fails the PR if a locale is missing.

**Content modeling:** Zod schemas in `src/content.config.ts` typed frontmatter feeds JSON-LD
directly: CV→`Person`+`knowsAbout`; portfolio→`CreativeWork`/`SoftwareSourceCode`; talks→`Event`;
courses→`Course`+`Offer`; blog→`BlogPosting`. Clean semantic HTML matters most for AI.

**CMS editing options:**
- **IDE + Front Matter (VS Code)** — zero lock-in baseline; **recommended default.**
- **Keystatic** — TS schema-as-code, tight Astro fit, stable; weak i18n (manual field duplication).
- **Sveltia CMS** — best bilingual UX (validates non-default locales, one-click MT); 0.x beta,
  single maintainer, no R2 media yet — **pick if bilingual editing UX is top priority, beta risk accepted.**
- **Decap** — battle-tested, broad backends, but slowed since 2023, i18n duplication bug.
- **Pages CMS** — hosted, zero-infra, native R2 media + scheduling, free; strong dark horse.
- **TinaCMS** — visual editing but no native i18n + SaaS dependency; not recommended here.

**Media strategy:** Small post images stay in the bundle (build-time optimization). Stay in-repo until
~1 GB (GitHub recommended ceiling; 5 GB hard max). Galleries/downloads → **R2** (S3-compatible, zero
egress). GitHub Releases unmetered for large one-off downloads. **Avoid Git LFS.**

**Risks:** Sveltia 0.x beta churn; Keystatic i18n doesn't scale past 2 locales; scheduled publishing
on a static host needs a cron-triggered rebuild; JSON-LD/`llms.txt` directional, not confirmed.

---

## 05 — Design, UI/UX & Visual Identity

**Bottom line:** Astro static site + **Tailwind v4** (or vanilla CSS + W3C design tokens) + a
self-hosted variable typeface covering pt-BR diacritics. Direction: **"minimalist editorial + one
distinctive accent"** — credible, durable, best Core Web Vitals. WCAG 2.2 AA + CWV + content-first IA
from day one.

**Design directions:**
- **(1) Minimalist editorial + monospace accent** — whitespace, strong type scale, one saturated
  accent, restrained motion. Refs: leerob.com, overreacted.io, brittanychiang.com. **Recommended.**
- (2) Terminal/monospace-forward (mono as accent layer, not whole system).
- (3) Warm blog-forward/personal (maggieappleton.com) — needs real photography/illustration.
- (4) Neo-brutalist — highest a11y/maintenance risk, ages fastest. **Discouraged whole-site.**

**Type & color:** Body **Inter** (variable, opsz) or **IBM Plex Sans** (100+ langs, distinctive);
mono JetBrains Mono / IBM Plex Mono; optional serif Source Serif 4 / IBM Plex Serif. All OFL, full
Latin Extended (ã õ á é ç). Self-host variable woff2, subset, preload, `font-display: swap`. Color in
**Oklch** ramps; deep-slate base (`#0f172a`) + one saturated accent (teal/cyan, indigo, or
Kotlin-adjacent orange/purple). Semantic tokens (bg/surface/text/muted/accent/border/focus-ring),
re-pointed per theme. Text contrast ≥4.5:1, non-text ≥3:1.

**Styling/components:** **Tailwind v4** (Rust "Oxide" engine, 3.5–100× faster, CSS-first) is the DX
leader; vanilla CSS + DTCG tokens (Style Dictionary v4) is the zero-dep longevity option. Runtime
CSS-in-JS effectively retired. Interactive: **shadcn/ui** (copy-paste, owns code, low lock-in, Radix/
Base UI + Tailwind); React Aria if max a11y/i18n depth needed.

**Information architecture:** Flat hub. Top nav: **Home · Blog · Projects (OSS) · Talks/Events ·
About/CV · Contact**. Footer: Photos, Uses, Now, Materials/Downloads. Home = curated hub (latest posts,
featured talk via facade video, OSS cards, upcoming events). Reserve `/courses` now, gate later as an
island without touching the static core.

**A11y & performance:** WCAG 2.2 AA (ISO/IEC 40500:2025); new criteria — Focus Not Obscured (2.4.11),
Focus Appearance (2.4.13), Target Size 24×24px (2.5.8). Images AVIF + WebP/JPEG fallback via
`<picture>`, explicit dims (CLS), lazy off-fold, `fetchpriority="high"` on LCP hero, LQIP/BlurHash.
Video: **lite-youtube-embed facade** (~800ms faster LCP), youtube-nocookie.com. Motion: View
Transitions + scroll-driven, honor `prefers-reduced-motion`. Targets: Lighthouse ≥95, CLS <0.1,
LCP <2.5s mobile.

**Risks:** Over-engineering is the main trap (every dep = upgrade debt); native CSS masonry is
Firefox-only (use `column-count` fallback); bilingual drift needs schema-enforced flags; brutalism
conflicts with WCAG/CWV.

---

## 06 — SEO (Google) + GEO/AEO (AI Engines)

**Bottom line:** Classic SEO and AI discoverability share one foundation — fast semantic HTML,
structured data, E-E-A-T authority — diverging on a few tactics. Google still sends ~345× more traffic
than all AI engines combined, but AI-referred visitors convert 4–23× higher. Subdirectory bilingual
Astro on Cloudflare Pages serves both at $0.

**Classic SEO essentials:**
- **Locale URLs:** subdirectories `/en/` + `/pt-br/` (consolidate authority; avoid ccTLDs/subdomains/`?lang=`).
- **hreflang:** reciprocal pt-BR/en/x-default on every page (67% of sites have ≥1 error → add CI validation).
- **Sitemaps:** locale-aware via `@astrojs/sitemap`; submit to Google Search Console **and Bing**.
- **Schema.org:** `Person`, `BlogPosting`/`Article`, `BreadcrumbList`, `Event`, `SoftwareSourceCode`,
  `CreativeWork`; `sameAs` for entity reconciliation, `knowsAbout` for topical authority.
- **Core Web Vitals:** LCP <2.5s, INP <200ms, CLS <0.1 @ p75 (Astro zero-JS makes this easy).
- **Metadata:** unique titles/descriptions per locale + OG + Twitter cards.
- **E-E-A-T:** visible bylines/dates, employer (Stone), KotlinConf talks, OSS status, consistent author markup.

**Bilingual SEO traps:** **Never hard-redirect by IP/locale** — Googlebot crawls from US IPs with no
`Accept-Language` and will miss non-English pages. Serve neutral `/`, detect locale client-side, keep
a visible switcher, never cookie-lock. Non-reciprocal hreflang + wrong ISO codes are the top 2 errors.

**GEO/AEO for AI engines:**
- **Allow all crawlers** in robots.txt (personal brand → visibility wins): `GPTBot`, `OAI-SearchBot`,
  `ChatGPT-User`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `PerplexityBot`, `Google-Extended`,
  `Googlebot`. Drop deprecated `Claude-Web` / `anthropic-ai`.
- **Bing matters** — ChatGPT search uses Bing's index → submit sitemap to Bing Webmaster Tools + enable IndexNow.
- **`llms.txt`** — ship it (~30 min, useful to IDE agents); no AI engine confirmed to use it for citations.
- **Content structure** — answer-first "capsule" (2–4 sentences) atop each page; H2/H3, FAQs,
  comparison tables, stats with citations (per Princeton/GA Tech GEO study: Statistics + Cite Sources win).
- **WAF gotcha** — many sites allow GPTBot in robots.txt but silently block it at CDN/WAF with 429s
  (a leading cause of missing ChatGPT citations).

**Measurement:** GA4 custom channel group regex on `chatgpt.com|openai.com|perplexity.ai|claude.ai|
gemini.google.com|copilot.microsoft.com`; ChatGPT appends `utm_source=chatgpt.com` (desktop, since
Jun 2025); GSC added "AI Mode" filter (Jun 2025). ~70% of AI referrals arrive with no referrer (land
in "Direct") → treat measured AI traffic as a floor. Manual monthly testing of 20–30 target queries is
free and sufficient; paid trackers (Otterly ~$29/mo) only worth it once courses launch.

**Prioritized launch checklist:**
1. Astro + subdirectory i18n + Cloudflare Pages auto-deploy.
2. robots.txt allowing all AI + Googlebot; self-referencing canonicals; locale-aware sitemap.
3. Reciprocal hreflang (+CI validation); zero IP/locale hard-redirects.
4. CWV green: AVIF/WebP w/ dims, preload LCP image, verify in PageSpeed Insights.
5. JSON-LD (`Person`, `BlogPosting`, `BreadcrumbList`, `Event`, `SoftwareSourceCode`) → Rich Results Test.
6. Unique per-locale titles/descriptions + OG/Twitter cards.
7. E-E-A-T `/about` with `sameAs` (GitHub, LinkedIn, X, KotlinConf/Sessionize, Stone) + bylines/`dateModified`.
8. Submit sitemaps to Google + Bing; enable IndexNow.
9. GA4 + AI channel group.
10. Ship `llms.txt` (auto-generated).
11. Answer-first content style in the post template.

**Risks:** AI user-agent strings change often (re-verify after model releases); `Perplexity-User`/
`ChatGPT-User` can ignore robots.txt for user-initiated fetches; citation-lift claims are vendor
studies (directional); structured data isn't a direct ranking factor; measured AI traffic is a floor.

---

## 07 — Analytics & Metrics

**Bottom line:** For banner-free LGPD/GDPR compliance, cookieless **Umami** and **Plausible** lead.
**GA4 is unsuitable** (cookies + banner + ~135KB script). Staged approach: lightweight traffic
analytics now, event/conversion tracking when paid content launches → near-$0 initially.

**Options surveyed:**
- **Umami** — pageviews/visitors/events/revenue/replay; free 100k ev/mo Cloud or free MIT self-host;
  cookieless; best Astro DX. **Recommended.**
- **Plausible** — pageviews/visitors/referrers/UTM/AI-referrers/goals/funnels/revenue; $9/mo Cloud or
  free self-host CE; cookieless; polished.
- **PostHog** — full product analytics + funnels + Stripe revenue + feature flags; free 1M ev/mo;
  cookieless in anon mode. **Best for monetization (Stage 2).**
- **GoatCounter** — pageviews/referrers/basic events; free for personal, unlimited; cookieless; no funnels.
- **Matomo** — GA-depth + ecommerce + heatmaps; free self-host or ~€19–29/mo; banner unless cookieless;
  overkill.
- **Fathom** — pageviews/events/UTM; $15/mo, no free tier; cookieless; not self-hostable.
- **Cloudflare Web Analytics** — pageviews + CWV; free unlimited; cookieless; no event/conversion; 6-mo retention.
- **GA4** — deepest free analytics but cookies + banner + ~135KB + US transfer. **Not recommended.**

**Recommended:** **Umami** (MIT, ~2KB, cookieless/banner-free, `@yeskunall/astro-umami` integration,
custom events + revenue). Start on **free Umami Cloud** or self-host on ~$5/mo VPS. Layer **Cloudflare
Web Analytics** (free) as an ad-blocker-resistant baseline. Add **PostHog** (free 1M events) when
paid-content funnels + Stripe analysis matter.

**Costs:** Umami Cloud free $0 (100k ev/mo, 3 sites, 6-mo retention); Umami Pro $20/mo (~R$101);
self-host ~$5/mo (~R$25) or ~$1.48–2/mo PikaPods; Plausible Cloud $9/mo (~R$45); Cloudflare $0;
PostHog $0 ≤1M ev/mo.

**Privacy/compliance:** Umami/Plausible/GoatCounter/Cloudflare are cookieless, no personal data →
**no cookie banner under GDPR or LGPD**. Anonymized data is outside LGPD scope (Art. 12). Umami Cloud
is US-hosted → self-host for strict EU residency.

**Future conversion tracking:** Umami supports custom events + revenue out of the box; Plausible
Business/CE adds funnels/revenue; **PostHog best-in-class** (funnels, cohorts, Stripe warehouse,
feature-flag gating of paid content) — Stage 2 add when courses launch.

**Risks:** Umami Cloud free = 6-mo retention; self-hosting = ~$5/mo + maintenance; Cloudflare/
GoatCounter can't cover future conversion tracking alone; PostHog needs a banner in identified-user
mode; Partytown offloading has reliability pitfalls — verify reporting after each deploy.

---

## Suggested next steps
1. **Lock the core** (Astro + Cloudflare Pages + Cloudflare DNS + R2) — every report agrees; low risk.
2. **Defer the optional picks** (CMS UI, analytics host) — they don't block the build and have clean
   day-one defaults (edit-in-IDE, Umami Cloud free).
3. **Scaffold the repo** with the structure from §04 and the IA from §05; wire i18n subdirectories +
   hreflang + the SEO/GEO checklist from §06 into the base templates from the start.
4. **Attach payments later** (08) once a CNPJ/tax path and audience (Pix vs global) are decided —
   nothing in the core stack blocks it.
