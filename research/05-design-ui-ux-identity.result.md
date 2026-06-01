# Visual Identity, UI/UX, Design System & Look-and-Feel for rsicarelli.com — A 2025–2026 Landscape Report

## TL;DR
- **There is no single "right" answer, but the evidence points to a clear sweet spot for Rodrigo's constraints: an Astro (or Next.js) static site, styled with Tailwind CSS v4 or modern vanilla CSS driven by W3C design tokens, deployed on Cloudflare Pages via git auto-deploy, with a self-hosted variable typeface that fully covers pt-BR diacritics (Inter, Geist, or IBM Plex Sans).** This maximizes performance, AI/SEO discoverability, bilingual support, and low maintenance while leaving room for a future paid-content area.
- **The strongest design direction for a credible staff engineer + speaker + writer is "minimalist editorial with one distinctive accent"** — the pattern shared by the most respected developer sites (Lee Robinson, Dan Abramov, Brittany Chiang). A terminal/monospace or warm-blog-forward direction are viable alternatives; bold brutalism is the highest-risk option.
- **Accessibility (WCAG 2.2 AA), Core Web Vitals, and a content-first IA must be designed in from day one**, not retrofitted — they are mutually reinforcing and also drive both Google SEO and LLM citation.

## Key Findings

### Reference sites set the credibility bar
Analysis of the most respected senior-engineer/DevRel personal sites reveals a consistent pattern: restraint, typographic focus, fast load, and one memorable signature element.

- **Josh Comeau (joshwcomeau.com)** rebuilt his blog in 2024 on Next.js 15 App Router + React 19 + TypeScript, with MDX as "the most critical part of the tech stack." He migrated *away* from styled-components to **Linaria** (zero-runtime CSS-in-JS) specifically for React Server Components compatibility. His signature: whimsical, physics-based interactive components embedded in posts. (Source: joshwcomeau.com/blog/how-i-built-my-blog-v2/, Sept 2024.)
- **Lee Robinson (leerob.com)** runs Next.js + Tailwind + MDX on Vercel, evolving "from static HTML, to Jekyll, to Hugo, and finally to Next.js." Signature: extreme minimalism plus a personal dashboard of live metrics.
- **Brittany Chiang (brittanychiang.com)** — her famous "v4" was Gatsby + styled-components with a deep navy (#0a192f) and teal accent (#64ffda), pairing Calibre with SF Mono; it became one of the most-cloned dev portfolios. Her current redesign is Next.js with a slate-900 (#0f172a) navy base, a sticky two-column split layout, and a cursor-following spotlight glow.
- **Dan Abramov (overreacted.io)** — Gatsby, single-column, serif body text, pink/salmon accent, community-translated Markdown (a useful bilingual precedent).
- **Maggie Appleton (maggieappleton.com)** — migrated from Next.js to **Astro + MDX** in Dec 2024. In her Dec 2024 "Now" note she explained: "No shade on Next, but it wasn't the right framework for the job; I found myself constantly battling server-side rendering errors and trying to escape hatch out of React. Astro lets me return to writing plain HTML, CSS, and JavaScript … designed for content-heavy websites like this one." Signature: hand-drawn "digital garden" illustrations, CSS-only masonry, backlinks, notes labeled by maturity (seedling/budding/evergreen).
- **Brian Lovin (brianlovin.com)** — Next.js + Tailwind + Headless UI; his v6 (Nov 2023) moved content into Notion databases and removed the sidebar to feel more modern. Signature: app-like, iOS/macOS-inspired list-detail interface.

**Cross-cutting takeaways:** Next.js dominates; Astro is the notable migration target for content-heavy sites; Gatsby is now "legacy." Tailwind CSS is the modern default; runtime CSS-in-JS is in retreat at the high end. MDX is near-universal for those who write. Every great site is fast, mobile-perfect, and lets one personality element shine.

### The styling-approach landscape has consolidated
By 2026, the runtime CSS-in-JS model (styled-components, Emotion) is "on life support for new projects" — styled-components entered maintenance mode in 2025 and is RSC-incompatible. New projects choose **Tailwind CSS** (~12M weekly downloads, the DX winner), **CSS Modules** (the top styling choice at 65% in the State of React 2025 survey — ahead of Sass/SCSS at 59% and Styled Components at 58% — based on 3,760 responses collected Nov 2025–Jan 2026 by Devographics; zero runtime), modern **vanilla CSS** (now powerful enough with nesting, @layer, container queries, color-mix(), :has()), or **zero-runtime CSS-in-JS** (Panda CSS, vanilla-extract, StyleX). Tailwind CSS v4.0 (released Jan 22, 2025) is a ground-up rewrite with a Rust "Oxide" engine. Per Tailwind Labs' official v4.0 launch post: "full builds [are] over 3.5x faster, and incremental builds … over 8x faster … incremental builds that don't actually need to compile any new CSS — these builds are over 100x faster and complete in microseconds." It also uses CSS-first configuration and native cascade layers, @property, and color-mix().

### Bilingual (pt-BR + English) is a solved problem with clear best practices
- **Locale default + UX:** Best practice in 2025 is to *suggest* the detected locale (Accept-Language header / navigator.language) via a non-intrusive banner rather than force-redirect, always provide a visible language switcher, and persist the choice in a cookie/localStorage.
- **SEO:** Use subdirectory routing (/pt/, /en/), self-referencing hreflang on every variant plus x-default, matching `lang` attribute, per-language canonical, and per-language sitemaps. AI Overviews now source language-matched content, so genuinely native pt-BR and English content both matter.
- **Typography:** Brazilian Portuguese needs ã, õ, á, é, ç, etc. — i.e. solid **Latin Extended** coverage with well-designed diacritics. Strong free/open options that cover this well: **Inter** (variable, screen-optimized, opsz axis), **IBM Plex Sans** (OFL, 100+ Latin languages including Portuguese), **Geist**, **Source Sans/Serif**, **Work Sans** (diacritics enlarged for screen). For code: **JetBrains Mono, IBM Plex Mono, Fira Code, Geist Mono**.

### Performance-aware design is non-negotiable and well-understood
- **Fonts:** Self-host variable fonts, subset to Latin + Latin Extended, use `font-display: swap` and preload the critical weight. This avoids the Google Fonts third-party request and keeps CLS low.
- **Images:** AVIF (≈50% smaller than JPEG, 20–30% smaller than WebP) with WebP/JPEG fallback via `<picture>`, responsive `srcset`/`sizes`, explicit width/height (CLS), `loading="lazy"` for below-the-fold but **eager + fetchpriority="high"** for the LCP hero, and LQIP/blur (BlurHash/ThumbHash ~28–34 bytes, or base64) placeholders.
- **Video (KotlinConf talks):** A standard YouTube iframe adds ~800KB–1.3MB and 6+ requests before play. Use the **facade pattern** (lite-youtube-embed) — a thumbnail + play button that loads the real player only on click. Across monitored sites this yields ~800ms faster LCP; use youtube-nocookie.com for privacy.
- **Motion:** Prefer CSS (scroll-driven animations, View Transitions) over JS libraries; always honor `prefers-reduced-motion`. The **View Transitions API** reached cross-browser support in 2025 (same-document Baseline as of Oct 2025; cross-document in Chrome/Edge 126+, Safari 18.2+, Firefox 144+). Astro's `<ClientRouter />` provides it with automatic reduced-motion support and graceful fallback.

### Accessibility: WCAG 2.2 AA is the bar (and an ISO standard)
WCAG 2.2 (Oct 2023; ratified as ISO/IEC 40500:2025 in Oct 2025) adds 9 criteria over 2.1. The ones most relevant to a personal site: **2.4.11 Focus Not Obscured**, **2.4.13 Focus Appearance**, **2.5.7 Dragging Movements** (provide non-drag alternatives), and **2.5.8 Target Size (Minimum 24×24px)**. Baseline practices: semantic HTML first, visible focus indicators (never `outline:none` without replacement), full keyboard nav, sufficient contrast, `prefers-reduced-motion`, and proper ARIA only where native elements don't suffice.

### Design tokens are now a stable W3C standard
The **Design Tokens Community Group spec reached its first stable version (2025.10) on Oct 28, 2025** (confirmed by the W3C DTCG announcement), with reference implementations in **Style Dictionary v4** (first-class DTCG support), Tokens Studio, and Terrazzo. It was developed by 20+ editors from Adobe, Google, Microsoft, Meta, Figma, Salesforce, and others; per Mike Kamminga of Tokens Studio, "The DTCG spec v1 gives the industry a stable foundation. By solving multi-file support, theming, and including advanced color support, it unlocks an agnostic design systems and tooling ecosystem." Tokens use JSON (`.tokens.json`), support theming/multi-brand, modern color (Oklch, Display P3), and aliasing. The practical pattern: primitive tokens → semantic tokens → component tokens, emitted to CSS custom properties; dark/light mode = re-pointing semantic tokens. For a solo site this can be as light as a single tokens file feeding CSS variables.

### Headless UI / components: pick by layer, keep it minimal
For a content-first static site, most "components" are just well-styled HTML. Where interactivity is needed (dialog, menu, tabs, language switcher, lightbox), the 2026 landscape:
- **Radix UI** — 30+ accessible primitives, the de-facto base (now under WorkOS; update velocity slowed on complex components like Combobox).
- **Base UI** — actively maintained MUI-backed alternative; shadcn/ui added it as a supported base in 2025.
- **React Aria (Adobe)** — deepest accessibility/i18n, more code per component; best when a11y is paramount.
- **Ark UI** — cross-framework (React/Vue/Solid), state-machine based.
- **Headless UI** — small, Tailwind-team set, simplest API.
- **shadcn/ui** — copy-paste components on Radix/Base UI + Tailwind; you own the code (low lock-in).
- Framework-native: **Melt UI/Bits UI** (Svelte), **Kobalte** (Solid).

### Hosting / git-as-CMS / auto-deploy
- **Cloudflare Pages** is the strongest fit for this profile. Per Cloudflare Pages' own platform-limits docs, the **free plan** includes 500 builds/month, 1 concurrent build, 100 custom domains per project, 20,000 files per site, and **unlimited sites, seats, and bandwidth**; commercial use is allowed and it spans 300+ edge locations. Git push auto-deploys.
- **Netlify** — best DX/built-in features (forms, identity), but moved to a credit-based free tier (300 credits/month) in Sept 2025; overages can hard-stop the site.
- **Vercel** — best Next.js DX, but the free **Hobby plan prohibits commercial use** (relevant once selling courses) and bandwidth overages can surprise. Pro is $20/user/month.
- **GitHub Pages** — free, simplest for static, repo-native.
- **Git CMS for non-dev editing (optional):** **Sveltia CMS** (modern Decap rewrite, first-class i18n, free/OSS), **Decap CMS**, **TinaCMS**, **Keystatic**. All commit to the repo and trigger auto-deploy. For Rodrigo, who edits the repo directly, this is optional polish, but Sveltia's i18n is notable for a bilingual site.

### AI/LLM discoverability (ChatGPT, Claude, Perplexity, Gemini)
- **llms.txt** is a proposed standard (Markdown index of key pages); over **844,000 websites had implemented it per BuiltWith's tracking as of October 25, 2025** (including Anthropic, Cloudflare, and Stripe). **Caveat:** no major AI platform has confirmed they read it. At Google Search Central Live in July 2025, Gary Illyes stated, "We currently have no plans to support LLMs.txt," and John Mueller compared it to the discredited keywords meta tag. Treat it as cheap future-proofing, not a ranking lever.
- What actually works (per Cassidy Williams' documented experiment and GEO guidance): clear, jargon-free, question-shaped headings; consistent tagline/phrasing everywhere; allow AI crawlers in robots.txt (ChatGPT-User, PerplexityBot, ClaudeBot); strong internal linking; descriptive titles/meta; structured data (schema.org Person/Article); and genuinely useful content in both languages. Semantic HTML and fast static pages help LLM retrieval too.

## Details

### Moodboard-style design directions (options, with trade-offs)

1. **Minimalist editorial ("the credible default").** Generous whitespace, a strong type scale, one accent color, restrained motion. Live references: leerob.com, overreacted.io, current brittanychiang.com. *Pros:* ages extremely well, fastest to build/maintain, best readability for bilingual long-form, strongest CWV. *Cons:* can feel "templated" if the accent/type aren't distinctive. *Best for Rodrigo:* highest overall fit.
2. **Terminal / monospace developer aesthetic.** Monospace type (Geist Mono, JetBrains Mono, IBM Plex Mono), grid lines, command-palette navigation, subtle CRT/scanline touches. *Pros:* instantly "engineer," distinctive, on-brand for a Kotlin/Gradle/Rust author. *Cons:* monospace hurts long-form readability and diacritic rhythm; risk of cliché. *Best as:* an accent layer (code blocks, nav, footer) over an editorial base.
3. **Warm personal / blog-forward.** Serif or humanist-sans body, warm neutrals, photography of talks, hand-drawn or photographic warmth. Reference: maggieappleton.com, overreacted.io. *Pros:* human, memorable, great for storytelling and the photo gallery. *Cons:* needs real visual assets (illustrations/photos) to not feel plain.
4. **Bold neo-brutalist.** High-contrast blocks, thick borders, hard shadows, clashing color, oversized type. References: Figma/Gumroad refreshes. *Pros:* unforgettable, signals confidence. *Cons:* highest maintenance and accessibility risk, can undercut "senior/credible," ages fastest. *Best as:* a single hero flourish, not the whole system.

**Recommendation:** Direction 1 as the foundation, with a borrowed accent from Direction 2 (monospace for code, labels, and the command-palette/nav) — a combination that reads as both editorial and unmistakably engineer.

### Suggested type + color system rationale
- **Type pairing (all free/OFL, full pt-BR Latin Extended):** Body/UI in **Inter** (variable, opsz axis, superb screen legibility) *or* **IBM Plex Sans** (more brand-distinctive, 100+ languages incl. Portuguese, true italics). Code/labels in **JetBrains Mono** or **IBM Plex Mono** (pairs natively with Plex Sans). Optional display serif for post titles: **Source Serif 4** or **IBM Plex Serif**. Self-host as variable woff2, subset Latin+Latin-Extended, preload one weight, `font-display: swap`.
- **Color:** Build with design tokens in Oklch for perceptually even ramps. A professional-but-distinctive scheme: a near-black/deep-slate base (e.g. #0f172a family, as Brittany Chiang uses) with **one saturated accent** chosen to be personal and to pass WCAG AA contrast in both light and dark themes (teal/cyan, electric indigo, or a Kotlin-adjacent orange/purple). Define semantic tokens (bg, surface, text, muted, accent, accent-contrast, border, focus-ring) and re-point them per theme. Ensure non-text UI contrast ≥3:1 and text ≥4.5:1.

### IA / sitemap proposal (options, with trade-offs)

**Option A — Flat hub (recommended).** Top nav: Home · Blog · Projects (OSS) · Talks/Events · About/CV · Contact. Secondary (footer or About): Photos, Uses, Now, Materials/Downloads. *Pros:* simple, scannable, SEO-friendly URLs, easy bilingual mirroring. *Cons:* many content types compete for nav space — solve via grouping in the footer and a rich homepage.
- **Home** = curated hub: short intro, latest posts, featured talks (facade video), featured OSS cards, upcoming events, CTA.
- **Blog** = MDX, tags, RSS, per-language.
- **Projects** = OSS cards (repo name, description, language badge, stars, links) pulled from GitHub.
- **Talks/Events** = upcoming + past, with KotlinConf 2025 video (facade), slides/downloads, photo gallery per event.
- **About/CV** = web resume with print stylesheet + downloadable PDF.
- **Contact** = form (Netlify/Cloudflare forms or a mailto + social).

**Option B — Writing-forward.** Lead with the blog (à la overreacted/leerob); portfolio/CV are secondary. *Best if* thought leadership is the primary goal.

**Option C — App-like list-detail.** Persistent sidebar nav, content in the main pane (à la brianlovin v5). *Pros:* distinctive, scales to many content types. *Cons:* more JS/maintenance, weaker for SEO/print, heavier.

**Future paid content:** Reserve a `/courses` (or `/learn`) route now; launch later as a separate section linked from nav. Keep it static + a checkout/gated layer (e.g., a payment provider + simple access control) so the core site stays static and fast. A "uses" page and a "now" page are cheap credibility/SEO wins; add them in the footer.

### Showcasing assets well
- **Talk photos:** CSS columns or native CSS masonry (Firefox 128+ ships it; Chrome behind a flag in 2025 — use a column-count fallback) + a lightbox. For a static site, a small dependency-light lightbox (PhotoSwipe/GLightbox) or a `:target`/dialog-based pure-CSS lightbox keeps JS minimal. Always set image dimensions and lazy-load.
- **Talk videos:** lite-youtube-embed facade per video; store the video ID and a high-quality WebP poster.
- **OSS cards:** present repo name, one-line description, primary-language badge, stars/forks, and links; can be built at build time from the GitHub API to keep it static and current.
- **CV:** a semantic web resume with a dedicated **print stylesheet** (`@media print`) so "Save as PDF" looks polished; optionally generate a downloadable PDF in CI. Consider JSON Resume as a single data source feeding both the web and PDF.
- **Downloads:** a clear "Materials" section with file type, size, and language; track via simple analytics.

### Balancing distinctive brand with low maintenance
- Favor a **single tokens file + vanilla CSS or Tailwind v4** over heavy component frameworks; fewer dependencies = fewer upgrades.
- Prefer **native platform features** (View Transitions, CSS masonry, scroll-driven animations, `<picture>`) over JS libraries that need maintenance.
- Keep interactivity to a few well-chosen islands (Astro) rather than a full SPA.
- Choose **timeless type + one accent** over trend-driven brutalism so the look doesn't date.
- Automate the brittle parts (image optimization, GitHub stats, PDF) in CI so content updates are pure Markdown commits.

## Recommendations

**Stage 1 — Foundation (now).** Choose **Astro** (best fit: content-first, zero-JS default, MDX content collections, framework-agnostic islands, built-in i18n + view transitions, easy Cloudflare deploy) as the primary recommendation; **Next.js** is the equally valid alternative if Rodrigo prefers React everywhere and may want heavier app features for the future course platform. Deploy on **Cloudflare Pages** (free, unlimited bandwidth, commercial-use-OK, git auto-deploy). Set up the design-token file (DTCG/Style Dictionary or plain CSS variables), self-hosted Inter or IBM Plex Sans + a mono, and dark/light theming. *Benchmark to proceed:* Lighthouse ≥95 across the board, CLS <0.1, LCP <2.5s on mobile.

**Stage 2 — Bilingual + IA.** Implement subdirectory i18n (/pt/, /en/), browser-locale suggestion banner + visible switcher, hreflang + x-default + per-language sitemaps. Build the flat-hub IA (Option A). Write genuinely native content in both languages. *Benchmark:* both language trees fully crawlable; hreflang validates in Search Console.

**Stage 3 — Assets + polish.** Add talk gallery (masonry + lightbox), lite-youtube facades for KotlinConf, GitHub-powered OSS cards, web CV with print stylesheet, downloads section. Add View Transitions with reduced-motion fallback. *Benchmark:* WCAG 2.2 AA passes (axe/Lighthouse + manual keyboard test); CWV stay green with media added.

**Stage 4 — Discoverability + future paid content.** Add schema.org Person/Article structured data, robots.txt allowing AI crawlers, optional llms.txt, RSS. Reserve `/courses`. When ready, add a gated checkout as an island/separate section without compromising the static core. *Benchmark:* appears in ChatGPT/Perplexity answers for "Kotlin Multiplatform Brazil"–type queries; organic impressions rising.

**Thresholds that change the recommendation:** If Rodrigo wants rich app-like interactivity or a tightly integrated course platform from day one → Next.js over Astro. If he wants a non-technical editing UI → add Sveltia CMS. If traffic/video bandwidth grows large → Cloudflare's unlimited bandwidth becomes decisive over Netlify/Vercel.

### Comparison table (key decisions)

| Decision | Top pick | Strong alternative | Why / trade-off |
|---|---|---|---|
| Framework | Astro | Next.js | Astro = zero-JS, content-first, fastest CWV; Next.js = React everywhere, better for future app/course features |
| Styling | Tailwind v4 | Vanilla CSS + tokens | Tailwind = speed/DX/LLM-friendly; vanilla = zero deps, max longevity |
| Components | shadcn/ui (Radix/Base UI) | Headless UI / React Aria | Own the code, low lock-in; React Aria if a11y is paramount |
| Tokens | Style Dictionary (DTCG) | Plain CSS variables | Standard + multi-platform; plain vars simplest for solo |
| Hosting | Cloudflare Pages | Netlify / GitHub Pages | Unlimited bandwidth, commercial OK, git auto-deploy |
| Body font | Inter | IBM Plex Sans | Both OFL + full pt-BR; Plex more distinctive |
| Video | lite-youtube facade | self-host/Vimeo | ~800ms faster LCP, privacy |
| i18n | subdirectory + suggest banner | — | SEO-safe, user-respecting default |
| Design direction | Minimalist editorial + mono accent | Warm blog-forward | Credible, durable, fast |

### Shortlist of top stack candidates (with rationale)
1. **Astro + Tailwind v4 + Cloudflare Pages + self-hosted Inter/IBM Plex (RECOMMENDED).** Best overall fit: content-first, near-zero JS, perfect CWV, built-in i18n and view transitions, MDX content collections, trivial git auto-deploy, free hosting with unlimited bandwidth. Lowest long-term maintenance.
2. **Astro + vanilla CSS + DTCG tokens + Cloudflare Pages.** For maximum longevity and zero styling dependencies; uses modern CSS (nesting, @layer, container queries) and a single tokens file. Slightly more hand-work, but ages best and is the most "own-it" approach for a hands-on staff engineer.
3. **Next.js + Tailwind + shadcn/ui + Vercel/Cloudflare.** Choose if Rodrigo wants React everywhere and a tightly integrated, interactive course platform later. Heavier baseline JS; mind Vercel's commercial-use rule on Hobby.
4. **SvelteKit + Sveltia CMS + Cloudflare Pages.** Compelling if a friendly bilingual editing UI matters; Sveltia has first-class i18n and a beautiful admin. Smaller ecosystem than React/Astro.

### Key risks / trade-offs
- **Over-engineering** is the biggest risk for a hands-on engineer: every extra dependency (CSS-in-JS, large component libs, animation libraries) is future upgrade debt. Favor native CSS/platform features.
- **Lock-in:** Astro/Next/Tailwind/shadcn are all low-lock-in (open source, portable Markdown/MDX). Vercel's commercial-use restriction and Netlify's credit model are the main commercial gotchas.
- **Accessibility vs. flair:** brutalist/heavy-motion directions fight WCAG 2.2 and CWV; keep flourishes to one signature element.
- **Bilingual drift:** maintaining two language trees is real work; a content-collection schema that flags untranslated pages prevents silent gaps.

### Decision framework (which choice fits which priority)
- **Priority = fastest possible site + lowest maintenance →** Astro + vanilla CSS/Tailwind + Cloudflare Pages.
- **Priority = React ecosystem + future interactive course app →** Next.js + Tailwind + shadcn/ui.
- **Priority = distinctive, human brand →** warm blog-forward direction with real photography/illustration on the editorial base.
- **Priority = maximum credibility with minimum risk →** minimalist editorial + one accent + monospace code (the default).
- **Priority = non-technical future editing →** add Sveltia CMS on top of any of the above.

## Caveats
- **Forward-looking/uncertain items:** llms.txt has wide adoption (844,000+ sites per BuiltWith, Oct 25, 2025) but **no confirmed use by major AI platforms** — Google's Gary Illyes said in July 2025, "We currently have no plans to support LLMs.txt." Treat as low-cost hedging. Native CSS masonry is **not yet broadly shipped** (Firefox only in 2025; Chrome/Safari behind flags) — use column-count fallback. View Transitions are well-supported in Chromium/Safari and now Firefox 144, but verify fallback behavior.
- **Source quality:** Many "best portfolio" listicles are SEO content farms; reference-site facts here are anchored to the developers' own repos/posts. Some GitHub repos under "brittanychiang"/"leerob" are third-party clones, not the authors'.
- **Pricing volatility:** Hosting free-tier terms changed in 2025 (Netlify's credit model, Vercel's commercial-use rule). Re-verify current limits before committing, especially before launching paid content. (BRL figures: at ~R$5.0–5.4/USD in 2025–2026, Vercel/Netlify Pro ≈ R$100–110/month; Cloudflare Workers Paid $5 ≈ R$25–27/month.)
- **Brittany Chiang's current typefaces** could not be confirmed from a primary "uses" page; the Calibre/SF Mono pairing is documented only for her older v4 design.