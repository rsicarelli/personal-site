# SEO + GEO Playbook for rsicarelli.com: Ranking on Google and Getting Cited by AI Engines (2025–2026)

## TL;DR
- **Build a static/hybrid bilingual site (pt-BR + English) with Astro on Cloudflare Pages, using subdirectory locale URLs (`/en/`, `/pt-br/`), proper hreflang, JSON-LD `Person`/`BlogPosting`/`SoftwareSourceCode` schema, and an answer-first content style. This single architecture serves both classic SEO and AI discoverability — they overlap heavily but diverge on a few key tactics.** The git-as-CMS auto-deploy and free/OSS constraints are fully satisfiable.
- **For AI engines, the highest-leverage moves are not exotic: allow the right crawlers in `robots.txt` (especially retrieval bots OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot/Claude-User, plus Googlebot), submit a sitemap to Bing (ChatGPT search uses Bing's index), write extractable answer-first content, and build off-site authority (KotlinConf talks, OSS, guest posts). `llms.txt` is worth shipping for the developer-tool/IDE-agent use case but has no proven citation lift in 2025–2026 — do it cheaply, don't over-invest.**
- **Do NOT auto-redirect visitors (or Googlebot) by IP/browser locale.** Default to browser locale only via the root `/` route and an x-default gateway, never a hard 301/302 on localized URLs — IP/locale redirects are the single biggest international-SEO trap and can de-index your non-English pages because Googlebot crawls from US IPs without `Accept-Language` headers.

## Key Findings

### Classic SEO and GEO/AEO are two related-but-distinct goals
- **What overlaps:** crawlability, fast/clean semantic HTML, structured data, E-E-A-T/authority, freshness. Per Ahrefs (Patrick Stox/Ryan Law, July 2025 study of 1.9M citations from 1M AI Overviews), **76.1% of URLs cited in AI Overviews also rank in the top 10 of Google search results** — so strong SEO fundamentals directly power AI visibility.
- **What diverges:** Google still drives the overwhelming majority of traffic — per Ahrefs (as of September 2025), **"Google sends 345x more traffic to websites than ChatGPT, Gemini, and Perplexity combined"** — but AI-referred visitors convert dramatically higher (reported 4.4×–23× depending on study). GEO optimizes for *being quoted* (often zero-click), decays faster (one analysis: ~50% of AI-cited content is <13 weeks old; Seer Interactive reports content updated within 30 days receives ~3.2× more AI citations), and rewards answer-first structure, statistics, and citations over keyword density. Ahrefs' study of 863,000 keywords and ~4 million AI Overview URLs found only **38% of cited pages also appeared in the top 10 results, down from 76% in its July 2025 analysis** — meaning citation opportunity is opening up for well-structured pages without top rankings.

### AI crawler landscape (primary-source confirmed)
The critical distinction is **training crawlers vs retrieval/search crawlers**. Blocking training opts you out of future model memory (a privacy/IP choice); blocking retrieval/search removes you from live AI answers (a visibility choice). For a personal brand that *wants* discoverability, the default should be **allow everything** (a personal site has no IP to protect by blocking training).

| Vendor / bot | Type | Honors robots.txt? | Blocking implication |
|---|---|---|---|
| **GPTBot** (OpenAI) | Training | Yes | Excluded from future GPT base-model knowledge |
| **OAI-SearchBot** (OpenAI) | Search indexing | Yes | "sites blocking OAI-SearchBot will not appear in ChatGPT search answers" |
| **ChatGPT-User** (OpenAI) | User-initiated fetch | Documented as may not be governed by robots.txt the same way | Blocks live fetches during ChatGPT sessions |
| **ClaudeBot** (Anthropic) | Training | Yes | Excluded from Claude training data |
| **Claude-User** (Anthropic) | User-initiated retrieval | Yes (Anthropic makes NO exemption) | "may reduce your site's visibility for user-directed web search" |
| **Claude-SearchBot** (Anthropic) | Search indexing | Yes | "may reduce your site's visibility and accuracy in user search results" |
| **PerplexityBot** | Search indexing | Yes | Removed from Perplexity search index |
| **Perplexity-User** | User-initiated retrieval | **No** — "Since a user requested the fetch, this fetcher generally ignores robots.txt rules" | (cannot be controlled via robots.txt) |
| **Google-Extended** (token) | Gemini/Vertex training + grounding | Yes (control token, no separate UA) | "does not impact a site's inclusion in Google Search nor is it used as a ranking signal" |
| **Googlebot** | Search (classic + AI Overviews) | Yes | Removes you from Google entirely — never block |

Deprecated/legacy strings to drop: `Claude-Web` and `anthropic-ai` are no longer in Anthropic's current docs (support.anthropic.com, updated April 7, 2026). OpenAI's three official crawlers are documented at developers.openai.com with published IP JSON lists (gptbot.json, searchbot.json, chatgpt-user.json); OpenAI also notes OAI-SearchBot and GPTBot share crawl results to avoid duplicate crawling. OpenAI confirms ChatGPT appends `utm_source=chatgpt.com` to referral URLs, which aids analytics tracking. Google-Extended was introduced September 28, 2023, and Google's crawler docs (updated April 23, 2026) confirm it covers Gemini Apps and Vertex AI grounding. Important operational gotcha: many sites *allow* GPTBot in robots.txt but accidentally block it at the WAF/CDN layer with 429 rate limits — a leading cause of missing ChatGPT citations.

A recommended `robots.txt` posture for Rodrigo (allow all, block nothing):
```
User-agent: *
Allow: /
# Explicitly welcome AI search + retrieval + training (personal brand = visibility wins)
User-agent: Googlebot
Allow: /
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
Sitemap: https://rsicarelli.com/sitemap-index.xml
```

### llms.txt: ship it cheaply, don't overstate it
- **What it is:** a proposed Markdown file at `/llms.txt` (plus optional `/llms-full.txt`) listing your highest-value content with one-line descriptions. Proposed by Jeremy Howard (Answer.AI) on September 3, 2024.
- **Who consumes it (2025–2026):** IDE/coding agents (Cursor, Windsurf, Claude Code, GitHub Copilot, Cline, Aider) and some documentation MCP integrations actively fetch it. **No major AI search/answer engine has confirmed using it.** At Search Central Live (July 2025), Gary Illyes clearly stated that Google doesn't support LLMs.txt and isn't planning to; John Mueller separately compared it to the keywords meta tag.
- **Adoption/evidence:** Per SE Ranking (November 2025, ~300,000 domains), **just 10.13% had an LLMs.txt file**, and "Removing this variable from our XGBoost model actually improved its accuracy," concluding llms.txt "doesn't seem to directly impact AI citation frequency." One vendor monitored 500M+ AI bot visits over 90 days and found only 408 hits targeting llms.txt directly.
- **Verdict for Rodrigo:** Worth shipping because (a) he is a *developer* whose content will be consumed by IDE agents, and (b) it's a ~30-min auto-generated artifact. But it is forward-looking insurance, not a citation lever. Do not publish `llms-full.txt` if it would dump your entire paid-content corpus.

### Core Web Vitals (ranking factor, 2025–2026 thresholds)
Confirmed Google ranking signal (part of Page Experience). At the 75th percentile of real-user (CrUX) data, "good" thresholds are: **LCP < 2.5s, INP < 200ms, CLS < 0.1**. INP officially replaced FID in March 2024. Per the 2025 Web Almanac, only ~48% of mobile pages pass all three — a static Astro site ships zero JS by default and makes green CWV easy. Measure with Lighthouse (lab), PageSpeed Insights (lab + CrUX field), Search Console's CWV report, and the `web-vitals` JS library for RUM.

### Bilingual SEO (pt-BR + English)
- **URL strategy:** Subdirectories (`rsicarelli.com/en/`, `rsicarelli.com/pt-br/`) are the clear winner for a single-owner personal site — they consolidate domain authority, are simplest to maintain, and are supported by Search Console International Targeting. ccTLDs and subdomains fragment authority and add DNS/cert overhead with no benefit here. (John Mueller has stated subdomains and subdirectories are treated equivalently, but real-world data favors subdirectories for authority consolidation.) Parameters (`?lang=`) are discouraged.
- **hreflang:** Required to prevent duplicate-content consolidation across the pt-BR/EN pair. Implement reciprocal `rel="alternate" hreflang` tags (pt-BR, en, and x-default) in `<head>` or sitemap. Ahrefs' study of 374,756 domains using hreflang (Patrick Stox) found **67% of them have at least one issue** — the common errors are non-reciprocal tags and wrong ISO codes. Add a CI check so broken tags never ship.
- **Browser-locale defaulting WITHOUT redirect traps:** Google explicitly warns that Googlebot crawls from US IPs and sends no `Accept-Language` header, so auto-redirecting by locale means Google "might not find and crawl all your variations." Treat Googlebot like any user (no cloaking). The safe pattern: serve a neutral `/` that detects browser locale client-side and links/soft-redirects to the preferred version, keep a visible language switcher, never hard-redirect the localized URLs, and never cookie-lock users into one locale.

### Structured data / E-E-A-T for a real expert
JSON-LD (Google's preferred format). For Rodrigo, the high-value types are:
- **`Person`** (on an /about page): `name`, `jobTitle` ("Staff Software Engineer"), `worksFor` (Stone), `url`, `image`, `sameAs` (GitHub, LinkedIn, X, KotlinConf speaker page, Sessionize, etc.), `knowsAbout` (["Kotlin Multiplatform","Kotlin","Swift","Mobile Platform Engineering","Gradle"]), `alumniOf`. Google requires `author.name` to contain *only* the name (no titles).
- **`BlogPosting`/`Article`** on every post: `headline`, `author` (nested Person with sameAs), `datePublished`, `dateModified`, `image`, `publisher`.
- **`BreadcrumbList`** sitewide; **`Event`** for talks/upcoming events; **`CreativeWork`** for downloadable materials; **`SoftwareSourceCode`** for OSS projects (with `codeRepository` pointing to GitHub).
- Use `sameAs` for identity reconciliation and `knowsAbout` for topical authority. A controlled Search Engine Land experiment (2025) found only the well-implemented-schema page appeared in a Google AI Overview while the no-schema page failed to index. Validate with Google Rich Results Test + Schema Markup Validator.

E-E-A-T signals to wire in: link talks (KotlinConf 2025), the Google KMP Acceleration Program membership, OSS maintainer status, employer (Stone), publications, and consistent author markup across every article.

### GEO content tactics to become a cited source on KMP / mobile-platform engineering / his name
- **Answer-first writing:** Lead each page with a 2–4 sentence direct answer ("answer capsule") before context. This is reportedly the single highest-leverage formatting change.
- **Fact density + citations:** Aggarwal et al., "GEO: Generative Engine Optimization" (KDD 2024, Princeton/Georgia Tech/IIT Delhi/Allen Institute, DOI 10.1145/3637528.3671900), tested 9 methods across 10,000 queries (GEO-bench), finding GEO can "boost visibility by up to 40%," with **Statistics Addition, Cite Sources, and Quotation Addition the top performers**; keyword stuffing performed poorly.
- **Structure for extraction:** clear H2/H3 headings, FAQ sections, comparison tables, bullet lists, semantic HTML, machine-readable data.
- **Freshness:** maintain `dateModified`; schedule quarterly refreshes of cornerstone KMP content. Perplexity especially weights recency.
- **Bing matters:** ChatGPT search uses Bing's index — submit the sitemap to Bing Webmaster Tools (free; supports IndexNow).
- **Off-site authority/entity-building:** AI engines heavily cite community and earned media. Per the Otterly.AI "AI Citation Economy" report (1M+ data points across ChatGPT, Perplexity, Google AI Overviews, 2026), **"Community platforms (Reddit, Quora) capture 52.5% of citations vs. 47.5% for brand domains"**; Wikipedia is heavily favored by ChatGPT. Practical tactics: keep answering on Stack Overflow / Kotlin Slack / Reddit r/Kotlin, publish guest/byline posts, get listed on conference/speaker pages, and ensure consistent name+entity across all profiles. Note that only ~11% of domains are cited by *both* ChatGPT and Perplexity — platforms differ, so don't optimize for just one.

### Measuring AI-referral traffic and citations (and the real limits)
- **What's possible:** In GA4, build a custom channel group / regex on session source matching `chatgpt.com|openai.com|perplexity.ai|claude.ai|gemini.google.com|copilot.microsoft.com`. Perplexity passes referrers reliably (desktop + mobile); ChatGPT began appending `utm_source=chatgpt.com` in June 2025 (desktop). Google Search Console added an "AI Mode" filter (Search Appearance) in June 2025 — the only first-party Google AI data. Server-log analysis of bot user-agents (GPTBot, OAI-SearchBot, ChatGPT-User, etc.) shows crawl/citation-fetch activity.
- **The hard limits:** Most AI traffic is structurally invisible. One analysis (Clickport, April 2026) found ~70% of AI referral traffic arrives with no referrer and lands in "Direct." Google AI Overview clicks pass as normal `google/organic`. Mobile AI apps and zero-click citations are untrackable. Treat measured AI traffic as a *minimum baseline*, not the total.
- **Citation-tracking tools (paid, optional):** Otterly.AI (from ~$29/mo, broadest coverage at low cost; ~R$160/mo), Peec AI (from ~€89–€100/mo; ~R$550/mo), Profound (enterprise, ~$399–$499/mo; ~R$2,200–R$2,700/mo). For a personal site, **manual monthly query testing** (run 20–30 target queries through ChatGPT/Claude/Perplexity/Gemini and log mentions) is free and sufficient; a tracker is only worth it once paid courses launch.

## Details

### Recommended architecture (toolchain candidates)

**Static Site Generator — the realistic shortlist:**

| SSG | Language | Bilingual i18n | Git-as-CMS fit | CWV / perf | Best for | Cost |
|---|---|---|---|---|---|---|
| **Astro** ⭐ | JS/TS (framework-agnostic) | Built-in i18n routing (v4+): `locales`, `defaultLocale`, `prefixDefaultLocale`, `getRelativeLocaleUrl()`, browser-locale helpers; `@astrojs/sitemap` | Excellent (any Git host) | Ships zero JS by default; islands; top-tier CWV | Content + portfolio + interactive islands; TS-native | Free/OSS |
| **Next.js** | React/TS | i18n via app router + libs (next-intl) | Good | Heavier JS than Astro for content | If he wants React app sections + marketing in one stack; later paid-content app | Free/OSS (Vercel hosting tiers apply) |
| **Hugo** | Go (templates) | Mature built-in i18n | Excellent | Fastest builds; clean HTML | Pure speed, huge blogs; but Go templating, less TS-native | Free/OSS |
| **Eleventy (11ty)** | JS | Plugin-based i18n | Excellent | Minimal JS | Maximum flexibility, minimal opinions | Free/OSS |

For a TypeScript-fluent Staff Engineer who wants a blog + CV + portfolio + events + interactive islands + future paid content, **Astro is the strongest fit**: native TS, built-in i18n with hreflang-friendly helpers, content collections with type-safe Markdown/MDX, zero-JS-by-default CWV, and total control over JSON-LD. Hugo is the runner-up if build speed and a single binary appeal more than the JS/TS ecosystem; Next.js is the pick only if he wants the marketing site and a future paid-content web app in one React codebase.

**Hosting / git-as-CMS auto-deploy — the shortlist:**

| Host | Free tier | Auto-deploy from GitHub | Notes | Paid |
|---|---|---|---|---|
| **Cloudflare Pages** ⭐ | Unlimited bandwidth, 500 builds/mo, 100 custom domains, commercial use allowed | Yes (push-to-deploy + preview URLs) | Best free tier; 300+ edge locations; Workers/KV/D1/R2 for future paid-content/auth; no surprise bills | Workers Paid $5/mo (~R$28) for more builds |
| **Netlify** | Credit-based (300 credits/mo ≈ ~30GB / ~20 builds) | Yes | Great DX, forms/identity; credit model less predictable; per-seat for some features | Pro $19/mo (~R$105) |
| **Vercel** | 100GB bandwidth, 1M function calls; **Hobby bans commercial use** | Yes (deepest Next.js integration) | Excellent DX; commercial-use ban is a blocker once he sells courses; viral spikes can bill | Pro $20/mo per seat (~R$110) |
| **GitHub Pages** | 100GB soft bandwidth, 1GB repo, static only | Yes (Actions) | Simplest, but static-only, no commercial use, no edge functions | Free |

**Cloudflare Pages is the recommended host**: the unlimited-bandwidth free tier, commercial-use allowance (critical for selling courses later), edge functions (Workers) for future gated/paid content and locale logic, and predictable $0 bill align with every constraint. Auto-deploy on `git push` satisfies the git-as-CMS mandate. Vercel's Hobby commercial-use ban makes it unsuitable for the paid-content phase unless he pays for Pro.

**Free audit/monitoring stack (all free unless noted):**
- **Google Search Console** — indexing, CWV report, hreflang/International Targeting, AI Mode filter, sitemap submission. Essential.
- **Bing Webmaster Tools** — second index (powers ChatGPT search), Site Scan, IndexNow. Essential for GEO.
- **Lighthouse** (Chrome DevTools / CI) + **PageSpeed Insights** (lab + CrUX field) — CWV and on-page SEO. Run Lighthouse in CI via GitHub Actions on every PR.
- **Unlighthouse** — open-source, scans every page's Lighthouse scores at once (ideal for a multi-page bilingual site).
- **Google Rich Results Test + Schema Markup Validator** — validate JSON-LD.
- **Screaming Frog (free ≤500 URLs)** — crawl, find broken links, duplicate titles, canonical/hreflang issues.
- **Ahrefs Webmaster Tools (free for verified sites)** — site audit (170+ checks), backlinks, and it can track LLM traffic.
- **GA4** (free) with the AI custom channel group; optional **Looker Studio** dashboard.
- **`web-vitals` library** (free/OSS) for real-user CWV, optionally piped to a Cloudflare Worker endpoint.
- **AI citation testing:** manual monthly query runs (free); optionally Otterly.AI (~$29/mo) once monetizing.

### Prioritized LAUNCH checklist (ordered by impact)
1. **Architecture:** Astro + subdirectory i18n (`/en/`, `/pt-br/`) + Cloudflare Pages auto-deploy from GitHub. Wire DNS (CNAME/A to Cloudflare).
2. **Crawlability baseline:** clean URLs, XML sitemap (`@astrojs/sitemap`, locale-aware), `robots.txt` allowing Googlebot + all AI retrieval/search/training bots, self-referencing canonicals.
3. **hreflang:** reciprocal pt-BR/en/x-default on every page; CI validation. No IP/locale hard-redirects.
4. **Core Web Vitals green:** zero-JS-by-default, AVIF/WebP images with width/height (no CLS), preload LCP image, lazy-load below fold. Verify LCP<2.5s / INP<200ms / CLS<0.1 in PSI.
5. **Structured data:** `Person` (about page), `BlogPosting` (posts), `BreadcrumbList`, `Event`, `CreativeWork`, `SoftwareSourceCode`; validate.
6. **Metadata & social:** unique titles/descriptions per locale, Open Graph + Twitter cards, OG images.
7. **E-E-A-T:** rich /about with `sameAs` (GitHub, LinkedIn, X, KotlinConf/Sessionize, Stone), bylines + visible dates on posts.
8. **Submit to Google Search Console AND Bing Webmaster Tools;** submit sitemaps to both; enable IndexNow.
9. **GA4 + AI channel group;** GSC + Bing verification.
10. **Ship `llms.txt`** (auto-generated, curated links to top content) — low effort, dev-agent upside. Skip `llms-full.txt` if paid content exists.
11. **Answer-first content style** baked into post template (TL;DR/summary block at top).

### Prioritized ONGOING checklist
1. **Publish consistently** — AI crawlers favor recent content (reported ~65% of AI bot hits target <1-year-old pages); freshness compounds.
2. **Refresh cornerstone KMP content quarterly;** update `dateModified`.
3. **Build off-site authority:** conference talks, OSS READMEs, guest posts, Stack Overflow / Reddit r/Kotlin / Kotlin Slack answers, podcast/interview mentions.
4. **Monitor monthly:** GSC (CWV, coverage, AI Mode), Bing, GA4 AI channel; run 20–30 target queries through ChatGPT/Claude/Perplexity/Gemini and log mentions for his name + KMP topics.
5. **Re-audit robots.txt after major model releases** (UA strings change); confirm no WAF/429 blocking of allowed AI bots.
6. **Lighthouse in CI** to catch perf regressions on every deploy.
7. **Watch hreflang errors** in GSC International Targeting.

## Recommendations

**Stage 1 (Launch MVP, weeks 1–3):** Astro + Cloudflare Pages + subdirectory i18n + hreflang + green CWV + core JSON-LD (`Person`, `BlogPosting`) + GSC/Bing/GA4. This alone covers most of both SEO and GEO value at $0. **Threshold to proceed:** all pages indexed in GSC, CWV green in PSI field data, schema validates clean.

**Stage 2 (Authority + GEO depth, months 1–3):** answer-first content templates, FAQ/table-rich KMP cornerstone posts, `Event`/`SoftwareSourceCode` schema, `llms.txt`, off-site authority push (talks, OSS, guest posts, community answers). **Threshold:** begin appearing in manual AI query tests for niche/branded queries (expect a 4–8 week lag after publishing).

**Stage 3 (Monetization + measurement, when courses launch):** add Cloudflare Workers for gated/paid content; consider a paid citation tracker (Otterly.AI ~$29/mo) only if AI referral becomes a meaningful funnel; add CrUX RUM via `web-vitals`. **Threshold to buy a tracker:** manual testing becomes too time-consuming OR AI-referred conversions appear in GA4.

**What would change these recommendations:**
- If Google formally adopts `llms.txt` (watch for 2026–2027 announcements) → elevate it from insurance to priority.
- If he wants a unified marketing-site + paid-course web app in React → switch SSG to Next.js and reconsider Vercel Pro.
- If AI-referred traffic ever rivals organic in GA4 → invest more in GEO-specific content and a citation tracker.
- If a specific platform (e.g., Perplexity) dominates his referrals → tailor content to that platform's biases (recency for Perplexity, encyclopedic depth for ChatGPT).

## Decision Framework (which choice fits which priority)
- **Priority = simplest path, max performance, TS-native, future paid content →** Astro + Cloudflare Pages (the recommended default).
- **Priority = pure build speed / single binary, comfortable with Go templates →** Hugo + Cloudflare Pages.
- **Priority = one React codebase for marketing site AND a future course web-app with auth/payments →** Next.js + Vercel Pro (accept the cost and commercial-use terms).
- **Priority = absolute minimum tooling, OSS-only, no edge functions needed →** Astro/Hugo + GitHub Pages (but migrate before selling courses, since GitHub Pages forbids commercial use).
- **Priority = guaranteed visibility in AI answers →** allow all AI bots, submit to Bing, answer-first content, off-site authority — these matter more than any single tool choice.
- **Priority = measurement rigor before spending →** start free (GA4 AI channel + manual query logs + GSC AI Mode); buy a tracker only when paid funnels exist.

## Caveats
- **Rapidly changing area.** AI crawler names, robots.txt behaviors, and referral attribution change frequently; re-verify after major model launches. Figures on AI traffic share, conversion multiples, and citation lift come largely from vendor/marketing studies with an interest in framing the channel as large — treat them as directional, not precise.
- **Perplexity-User and ChatGPT-User can ignore/loosely-honor robots.txt** — you cannot fully control user-initiated fetches via robots.txt; only WAF/server rules would (which you don't want here since you seek visibility).
- **`llms.txt` has no demonstrated citation benefit** in 2025–2026 per the SE Ranking 300k-domain study; ship it for dev-agent utility and future-proofing only.
- **Measured AI traffic is a floor, not the truth** — most is invisible (no referrer, Direct bucket, AI Overviews as organic).
- **Don't over-engineer locale redirects** — the browser-locale default must be soft and crawler-safe; the biggest international-SEO failure mode is auto-redirecting Googlebot.
- **Structured data is not a direct ranking factor** (Google's position) — it unlocks rich results, AI Overview citations, and entity recognition, but won't outrank great content; Google's March 2026 core update narrowed FAQ/HowTo rich-result eligibility.