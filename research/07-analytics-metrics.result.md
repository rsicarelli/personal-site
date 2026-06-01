# Privacy-Friendly, Open-Source-First Web Analytics for rsicarelli.com (2025–2026 Landscape)

**Prepared for:** Rodrigo Sicarelli — personal site (static/hybrid, git-as-CMS auto-deploy, bilingual pt-BR/EN, performance + SEO + LLM-discoverability as first-class goals). Exchange rate used throughout: **USD 1 = BRL 5.04** (USD/BRL 5.0353, exchange-rates.org, June 1, 2026; the real has been volatile, 52-week range ≈ R$4.89–5.74).

## TL;DR
- **Best near-zero-cost, banner-free setup:** Self-host **Plausible Community Edition** or **Umami** on a cheap VPS (~$5/mo / ~R$25), OR use **Umami Cloud's free tier** (100k events/mo, 3 sites, 6-month retention). All are genuinely cookieless, store no personal data, and need **no cookie banner** under both GDPR and Brazil's LGPD. For literal $0 with a one-line install, **Cloudflare Web Analytics** (free, natural since you're already wiring DNS) or **GoatCounter** (free for personal/non-commercial, unlimited pageviews) are excellent.
- **One tool for both site analytics now AND paid-content conversion events later:** **PostHog** (1M events/mo free; product analytics + funnels + Stripe revenue + feature-flag gating) is the most capable for monetization. **Plausible** (Business/CE: goals, funnels, revenue) and **Umami** (events + revenue) are lighter and still cover conversion goals.
- **Self-host vs hosted free tier:** Self-hosting buys full data ownership and unlimited volume for ~$5/mo but adds maintenance (updates/backups/security). A generous hosted free tier (Umami Cloud, Cloudflare, GoatCounter) is zero-maintenance and more than enough for a personal site. Given Rodrigo's profile (highly technical, git-as-CMS, OSS maintainer), self-hosted Umami or Plausible CE fits the ethos, while Cloudflare/Umami Cloud are the pragmatic low-effort picks.

## Key Findings
1. **Cookieless ≠ automatically banner-free in the EU, but for this use case it effectively is.** Tools that store no personal data and use no cookies/localStorage (Plausible, Umami, GoatCounter, Fathom, Cloudflare, Counter.dev) do not require a consent banner under GDPR/PECR, and fall **outside LGPD's scope entirely** when data is genuinely anonymized (LGPD Art. 12 excludes anonymized data from the definition of personal data).
2. **GA4 is the wrong baseline for this site.** It uses cookies (`_ga`, 2-year), classifies that as personal data, requires Consent Mode v2 + a Google-certified CMP cookie banner in the EU, transfers data to the US (ruled GDPR-non-compliant by multiple EU DPAs), and ships a large script — all hostile to Rodrigo's banner-free, performance, and privacy goals.
3. **Brazil's LGPD is materially more permissive than the EU on cookies.** Brazil has **no ePrivacy-Directive equivalent**. ANPD's *Guia Orientativo: Cookies e Proteção de Dados Pessoais* (v1.0, published 18 Oct 2022, relator Director Miriam Wimmer) explicitly allows **legitimate interest (legítimo interesse, Art. 7 IX)** as a legal basis for aggregate analytics cookies — *"a medição de audiência constituirá um interesse legítimo do controlador... com base em dados agregados e sem a combinação com outros mecanismos de rastreamento ou sem a formação de perfis."* So even cookie-based aggregate analytics needn't always be opt-in in Brazil — and cookieless tools sidestep the question completely.
4. **Script size matters for Core Web Vitals/SEO, and privacy tools win decisively.** Counter.dev ~1KB; Plausible markets "<1KB" (≈2.5KB gzipped on their own comparison page); Fathom ~2KB; Umami ~2KB; GoatCounter ~3.5KB. By contrast Plausible's measurement puts the **GA4 script itself at ~135KB**, rising past ~285KB once Google Tag Manager and a consent platform are added.
5. **For future paid courses**, event/conversion tracking exists on PostHog (deep — funnels, revenue, Stripe), Plausible Business/CE (goals, funnels, revenue), Umami (events + revenue), Fathom (events), and Matomo (goals, ecommerce). **Cloudflare and GoatCounter are weakest here** and would need a second tool for monetization analytics.

## Details — Tool by Tool

### Plausible Analytics
- **What it is:** Open-source (AGPL-3.0), privacy-first, EU-made/EU-hosted lightweight analytics. Cloud SaaS or self-hosted Community Edition (CE).
- **Metrics/methodology:** Page views, unique visitors, sources/referrers, top pages, countries, devices/browsers, UTM campaigns, scroll depth, goals/funnels, **AI-referrer tracking** (ChatGPT/Perplexity/Claude), Google Search Console integration. Cookieless: server-side daily-rotating salt hash of IP+User-Agent; IP never stored to disk. Script marketed "<1KB" (~2.5KB gzipped). No sampling.
- **Privacy/compliance:** No cookies, no personal data, GDPR/CCPA/PECR compliant, no banner needed. EU data residency (Hetzner Germany; Bunny CDN). Outside LGPD scope when anonymized.
- **Cost (Cloud):** No free tier (30-day trial, all Business features). Starter **$9/mo (~R$45)** 10k pv/1 site; Growth **$14/mo (~R$71)** 3 sites/team; Business **$19/mo (~R$96)** 10 sites + funnels/revenue/Stats API/Looker Studio. Annual = 2 months free; 15% nonprofit/OSS discount on Business annual.
- **Self-host (CE):** Free (AGPL). Docker Compose + ClickHouse. Realistically ~$5–6/mo VPS for a personal site (some estimates $12–24/mo on DigitalOcean). Unlimited pageviews/retention. CE lacks a few Cloud-only extras (Looker Studio connector, some team UI).
- **Integration:** Single script tag; on Astro via Partytown (`type="text/partytown"`) or the `astro-analytics` `<Plausible domain=.../>` component. Clean with static/git auto-deploy.
- **Conversions later:** Yes — goals, custom events, funnels, ecommerce **revenue attribution** (Business tier / CE).
- **Best for:** Privacy purists wanting a polished single-page dashboard + SEO/AI-referrer insight. **Lock-in:** Very low (open source, full export).

### Umami
- **What it is:** MIT-licensed (most permissive in class), Next.js + PostgreSQL, open-source. Cloud or self-host.
- **Metrics/methodology:** Page views, visitors, referrers, countries, devices/browsers, custom events, UTM, **session replay (v3.1, rrweb)**, custom Boards. Cookieless: server-side salted hash (rotates, default monthly/configurable). No PII. ~2KB script. Note: does **not** honor DNT/GPC by default.
- **Privacy/compliance:** Cookieless, GDPR/CCPA compliant, no banner needed, full data export (no lock-in). **Cloud is US-primary** (subprocessors Vercel/Cloudflare/ClickHouse US; Hetzner EU secondary) — strict EU-residency users should self-host. Outside LGPD scope when anonymized.
- **Cost (Cloud):** **Free Hobby tier: up to 100k events/mo, up to 3 websites, 6-month data retention, community support, no credit card** (most generous free plan among hosted privacy tools). **Pro $20/mo (~R$101):** 1M events/mo included ($0.00003/additional event), up to 20 sites, 10 team members, 2-year retention. Business $200/mo (10M events).
- **Self-host:** Free (MIT). Single Postgres container + Node.js — no ClickHouse/Kafka. Runs on a **$5/mo VPS**; managed options like PikaPods reported ~$1.48–2/mo. Data retained indefinitely.
- **Integration:** Script tag in `<head>`; dedicated **`@yeskunall/astro-umami`** integration (auto-injects, View-Transitions aware, optional Partytown). Excellent for static/git-deploy.
- **Conversions later:** Yes — custom events + revenue tracking.
- **Best for:** Indie devs / OSS maintainers wanting MIT licensing and the lightest stack. **Lock-in:** Very low.

### PostHog
- **What it is:** Open-source all-in-one product analytics suite (analytics, session replay, feature flags, A/B tests, surveys, error tracking, LLM analytics, data warehouse).
- **Metrics/methodology:** Everything Plausible/Umami do plus funnels, retention, cohorts, paths, SQL (HogQL). Web analytics runs cookieless/anonymous by default (no person profiles); becomes personal-data when you enable identified users.
- **Privacy/compliance:** Can be GDPR-compliant; **EU Cloud option** exists. Anonymous mode = no banner; **identified/person-profile mode requires consent and likely a banner.** Larger script than minimalist tools.
- **Cost:** **Free: 1,000,000 events/mo, 5k session recordings, 1M feature-flag requests, 1-year retention, unlimited team members, no credit card** — PostHog states >90% of companies stay free. Pay-as-you-go after: product analytics **$0.00005/event (1–2M tier)**, stepping down with volume to **$0.000009/event at 250M+ (≈82% discount)**. Per-product billing limits available.
- **Self-host:** Open-source but heavy (ClickHouse, Kafka); PostHog now steers small users to Cloud and has deprecated new Kubernetes/Helm self-host deployments. **Not recommended for a personal site.**
- **Integration:** JS snippet / npm; works with Astro/Next. More setup than a single tag.
- **Conversions later:** **Best in class** — funnels, revenue, Stripe import via data warehouse, feature flags to gate paid content.
- **Best for:** When paid courses/conversion analytics become a serious priority. **Lock-in:** Low–moderate (export available; richer schema).

### GoatCounter
- **What it is:** Open-source, single Go binary, by Martin Tournoij. Donation-supported hosted service or self-host.
- **Metrics/methodology:** Page views, referrers, countries, browser, screen size, basic events, campaigns. Cookieless, no persistent identifiers, no GDPR notice needed. ~3.5KB script; also offers JS-free pixel / backend-middleware / logfile options. Accessibility-first dashboard (semantic HTML, ARIA).
- **Privacy/compliance:** No cookies, no personal data, GDPR/CCPA compliant, no banner. Outside LGPD scope when anonymized.
- **Cost:** **Hosted free for personal/non-commercial use, unlimited pageviews.** Commercial: paid (some reviews cite ~$5/mo for 100k pv; a Business tier ~$15/mo).
- **Self-host:** Free, trivial — single static binary + SQLite (or Postgres). Runs on the smallest VPS (~$4/mo) or a home server. Docker available.
- **Integration:** Single script tag; JS-free tracking pixel is ideal for static generators (Astro/Hugo/Jekyll).
- **Conversions later:** Limited — basic events only; no funnels/revenue.
- **Best for:** Personal blogs/portfolios wanting genuinely free + ethical + minimal. **Lock-in:** Very low.

### Matomo
- **What it is:** The most feature-rich open-source GA4 alternative (GPL-3.0). Cloud (InnoCraft, EU/Germany) or self-host (On-Premise).
- **Metrics/methodology:** Full GA-depth — goals, ecommerce, funnels, heatmaps, session recording, A/B testing, tag manager, user flows. Can run cookieless via config_id (24h visit grouping).
- **Privacy/compliance:** **Default install uses first-party cookies → banner required under EU ePrivacy/PECR/TTDSG.** A cookieless / CNIL-exempt mode is opt-in (anonymize IP, disable cross-site, opt-out only) — then no banner. ISO 27001 certified; self-host = full data sovereignty. Offers an official MCP server for LLM querying of analytics.
- **Cost (Cloud):** Business starts at **€19–29/mo (~R$104–159)** for 50k hits / up to 30 sites; scales by hits; above ~10M hits = custom. (Sources vary between €19 and €29 entry depending on date/tier; verify on matomo.org/pricing.)
- **Self-host:** Free forever (GPL), unlimited hits/sites. Needs PHP + MySQL/MariaDB + archiving cron; ~2 CPU/2GB VPS for ≤100k pv. Premium plugins cost extra on self-host (heatmaps ~€199/yr, session recording ~€149/yr, A/B ~€249/yr) but are bundled on Cloud Business+.
- **Integration:** JS snippet; `astro-analytics` `<Matomo>` component. Heavier than Plausible/Umami.
- **Conversions later:** Excellent — goals, ecommerce/revenue, funnels.
- **Best for:** When you want GA4 feature depth with data ownership. **Overkill for a personal site**, but the gold standard for sovereignty. **Lock-in:** Low (self-host) / moderate (Cloud).

### Fathom Analytics
- **What it is:** Proprietary, privacy-first, cookieless hosted analytics (Canada-based; EU isolation option). **Not self-hostable.**
- **Metrics/methodology:** Page views, visitors, referrers, countries, devices, events, UTM. Cookieless (hash+salt "user signature"); bypasses ad blockers via DNS. ~2KB script. Bot filtering.
- **Privacy/compliance:** GDPR/CCPA/ePrivacy/PECR compliant, no banner. EU Isolation keeps EU-visitor data in the EU (Schrems II). DPA available.
- **Cost:** No free tier (7-day trial). **$15/mo (~R$76)** for 100k pv, up to 50 sites included; scales by pageviews. Annual = 2 months free.
- **Integration:** Single script line; `astro-analytics` `<Fathom>` component.
- **Conversions later:** Yes — custom events, UTM, ecommerce sale events. No funnels/cohorts.
- **Best for:** Those wanting polished, zero-maintenance, ethically-run *paid* analytics without self-hosting. **Lock-in:** Moderate (proprietary, but data export).

### Cloudflare Web Analytics
- **What it is:** Free, privacy-first analytics from Cloudflare. Client-side JS beacon (works without DNS proxy) or edge-based (if proxied).
- **Metrics/methodology:** Page views, visitors, top pages, top referrers, Core Web Vitals/RUM via the Performance API. **No cookies, no client-side state, no fingerprinting.**
- **Privacy/compliance:** Cookieless and banner-free for the analytics product itself; **Cloudflare is a US company** and processes IP/User-Agent server-side (still personal data, though not used for fingerprinting). A privacy-policy mention is advisable; no consent banner needed for analytics alone. If you also enable other Cloudflare security features, those may set cookies (`__cf_bm`, `_cfuvid`, etc.).
- **Cost:** **Free, no traffic limits.** Retention only ~6 months (shortest tested). Historically one analytics property per account (multi-site improving).
- **Integration:** One JS snippet, or zero-code if you proxy DNS through Cloudflare. Since Rodrigo already owns the domain and only needs DNS wiring, Cloudflare is a natural fit.
- **Conversions later:** **No event/conversion tracking** — pure traffic stats. Needs a second tool for paid-content events.
- **Best for:** Truly $0, zero-maintenance baseline. **Lock-in:** None.

### Vercel Web Analytics
- **What it is:** Built-in analytics if hosting on Vercel. Privacy-friendly, cookieless.
- **Metrics/methodology:** Page views + custom events, referrers, top pages, devices, countries. Cookieless.
- **Cost:** **Free Hobby: 50k events/mo** — but **Hobby is non-commercial only**, a real constraint given Rodrigo's monetization plans (would require Pro). Pro: 100k events included, then **$0.00003/event (~$3 per 100k)**; Plus add-on $10/mo for UTM + extended retention. (Pricing cut ~79–80% on May 8, 2025; Hobby raised 20×, Pro 4×.)
- **Integration:** `@vercel/analytics` package — trivial if deploying on Vercel; tied to Vercel hosting.
- **Conversions later:** Custom events yes (Pro); limited depth.
- **Best for:** Only if hosting on Vercel anyway; the Hobby non-commercial restriction undercuts it for a monetizing site. **Lock-in:** Tied to Vercel.

### Netlify Analytics
- **What it is:** Server-side (log-based) analytics; no client JS, so no performance impact and it counts ad-blocked traffic.
- **Metrics/methodology:** Page views, top pages, bandwidth, referrers, top sources. **No event/conversion tracking.** Basic.
- **Privacy/compliance:** Server-side, cookieless, no banner.
- **Cost:** **$9/site/mo (~R$45)** — per-site, not bundled; no free analytics tier. (Netlify moved its hosting to credit-based pricing in Sept 2025.)
- **Integration:** Toggle-on if hosting on Netlify; zero code.
- **Conversions later:** No.
- **Best for:** Only if already on Netlify and wanting effortless basic server-side numbers. Poor value vs alternatives. **Lock-in:** Tied to Netlify.

### Counter.dev
- **What it is:** Open-source (AGPL-3.0), Germany-based, minimalist, pay-what-you-want.
- **Metrics/methodology:** Unique daily visitors, referrers, countries, browsers, OS, screen sizes. **~1KB inline script.** No cookies, no IP fingerprinting, only aggregated data; backend never reads visitor IP (uses Cloudflare's CF-IPCountry header).
- **Privacy/compliance:** Strongest minimal-data posture, but **the vendor itself flags ePrivacy ambiguity** ("I don't know" on the banner question) and offers no DPA/published certifications. Outside LGPD scope when anonymized.
- **Cost:** **Permanently free (PWYW)**, no quotas/feature gates; optional donations €3+/mo. Self-host AGPL + Docker (the dev reports millions of unique visits/mo at ~25% CPU on a ~$5 VPS).
- **Integration:** Tiny inline script tag.
- **Conversions later:** No funnels/goals/events.
- **Best for:** Hobby/personal sites wanting the strongest privacy + free. Less suited where vendor accountability (DPA) matters. **Lock-in:** None.

### Google Analytics 4 (baseline reference only)
- **What it is:** Free, dominant, event-based analytics. Included as baseline.
- **Metrics/methodology:** Deepest free analytics — events, audiences, explorations, attribution, Google Ads/Search Console integration. Uses cookies (`_ga`, 2-year).
- **Privacy/compliance:** **Requires a cookie consent banner + Consent Mode v2 + a Google-certified CMP in the EU**; `_ga` is personal data; transfers data to the US (ruled GDPR-non-compliant by several EU DPAs); needs a DPA. Under LGPD, IP and cookies are personal data → a legal basis is required (legitimate interest is possible for aggregate, but Google's third-party sharing/profiling pushes toward consent). The GA4 script alone measures ~135KB (well past ~285KB with GTM + CMP) — hurts Core Web Vitals.
- **Cost:** Free (BigQuery costs at scale).
- **Integration:** gtag/GTM; Astro + Partytown possible but consent management is required for compliance.
- **Conversions later:** Excellent and free — at the cost of banners, performance, and privacy.
- **Verdict:** **Not recommended** for rsicarelli.com; conflicts with banner-free, performance, and privacy goals. Listed only for comparison.

## Comparison Table

| Tool | Free tier | Paid entry (USD / ~BRL) | Cookieless / no banner | Script | Self-host | Events/Conversions | EU data residency | Lock-in |
|---|---|---|---|---|---|---|---|---|
| **Plausible** | None (30-day trial) | $9 / R$45 (CE: free self-host) | ✅ / ✅ | "<1KB" (~2.5KB gz) | ✅ AGPL | ✅ goals/funnels/revenue (Business/CE) | ✅ EU | Very low |
| **Umami** | ✅ 100k ev/mo, 3 sites, 6-mo retention | $20 / R$101 (self-host free) | ✅ / ✅ | ~2KB | ✅ MIT | ✅ events + revenue | ⚠️ US Cloud / self-host for EU | Very low |
| **PostHog** | ✅ 1M ev/mo + 5k replays, 1-yr | usage from $0.00005/ev (→$0.000009 at 250M+) | ✅ anon / ⚠️ banner if identified | larger | ⚠️ heavy | ✅✅ best (funnels, Stripe, flags) | ✅ EU Cloud | Low–mod |
| **GoatCounter** | ✅ free personal, unlimited pv | ~$5–15 / R$25–76 commercial | ✅ / ✅ | ~3.5KB | ✅ easy | ⚠️ basic events | self-host any | Very low |
| **Matomo** | On-prem free | Cloud ~€19–29 / R$104–159 | ⚠️ banner unless cookieless mode | heavier | ✅ GPL | ✅✅ goals/ecommerce | ✅ EU (Cloud DE) | Low/mod |
| **Fathom** | None (trial) | $15 / R$76 | ✅ / ✅ | ~2KB | ❌ | ✅ events | ✅ EU isolation | Moderate |
| **Cloudflare** | ✅ free, unlimited (6-mo retention) | — | ✅ / ✅ | small | ❌ | ❌ | ❌ US | None |
| **Vercel** | ✅ 50k ev (non-commercial only) | $0.00003/ev (Pro) | ✅ / ✅ | small | ❌ | ⚠️ events (Pro) | depends | Vercel-tied |
| **Netlify** | ❌ | $9/site / R$45 | ✅ / ✅ (server-side) | none | ❌ | ❌ | depends | Netlify-tied |
| **Counter.dev** | ✅ free PWYW | €3+ donation | ✅ / ⚠️ (vendor unsure) | ~1KB | ✅ AGPL | ❌ | ✅ DE | None |
| **GA4** | ✅ free | free | ❌ / ❌ banner required | ~135KB | ❌ | ✅✅ free | ❌ US | High |

## Shortlist (top candidates)

1. **Umami — self-hosted on a ~$5 VPS, or the free Cloud tier (TOP PICK).** MIT license matches Rodrigo's OSS ethos, lightest stack, dedicated Astro integration, cookieless/banner-free, free, and supports custom events + revenue for future courses. Self-host for full ownership, or start on the free Cloud tier (100k ev/mo, 6-mo retention) with zero maintenance.
2. **Plausible — CE self-host or $9 Cloud.** Best polished single-page dashboard, sub-KB-class script, **AI-referrer + Search Console insights** (directly serves his SEO/LLM-discoverability goals), goals/funnels/revenue. Slightly heavier to self-host (ClickHouse) than Umami.
3. **Cloudflare Web Analytics.** Unbeatable $0, zero-maintenance baseline; natural since he's already wiring DNS. Best as a redundant/fallback layer. Caveats: no event tracking, US-based, 6-month retention.
4. **PostHog — free 1M events.** Choose if/when monetization becomes central: one tool covers traffic + funnels + Stripe revenue + feature-flag gating of paid content. Heavier script and setup.

## Recommendations (staged)

**Stage 1 — Launch (now, $0, banner-free):**
Deploy **Umami** — either self-hosted on a ~$5/mo (R$25) VPS (Hetzner/DigitalOcean) via Docker, or on the **free Umami Cloud tier** (100k events/mo, 6-month retention). Add it via `@yeskunall/astro-umami`. Optionally layer **Cloudflare Web Analytics** (free) as a redundant, ad-blocker-resistant baseline. No cookie banner required under GDPR or LGPD. *Benchmarks to revisit:* monthly events approaching 100k (Cloud cap), the 6-month retention window becoming limiting, or VPS upkeep feeling like a chore.

**Stage 2 — Add conversion tracking when paid content launches:**
Use Umami's (or Plausible's) **custom events + revenue** for course funnels (newsletter signup → checkout → purchase-complete). If you need true funnels, retention cohorts, or Stripe revenue analysis, **add PostHog** (free 1M events) for product analytics while keeping the lightweight tool for general traffic. *Threshold to consolidate on PostHog:* when you regularly analyze multi-step funnels or want feature-flag gating of paid content. Note: if you switch PostHog into identified-user mode, add a consent mechanism.

**Stage 3 — Scale / sovereignty (only if needed):**
If data sovereignty or GA-level depth ever becomes a hard requirement, migrate to **self-hosted Matomo** or **Plausible CE** on a larger VPS. *Trigger:* compliance/enterprise needs, or traffic where paid Cloud tiers exceed self-host total cost of ownership.

**Decision framework:**
- *Most value lightest footprint + MIT/OSS license + best Astro DX* → **Umami (self-host or Cloud free).**
- *Most value dashboard polish + SEO/AI-referrer insight* → **Plausible.**
- *Most value absolute $0 + zero maintenance* → **Cloudflare Web Analytics** (+ GoatCounter for the personal/non-commercial pieces).
- *Most value future monetization/funnel analytics in one tool* → **PostHog.**
- *Most value GA-level depth with data ownership* → **self-hosted Matomo.**
- *Avoid* GA4 (banners, performance, privacy) and Netlify/Vercel analytics (hosting lock-in, weak/limited) unless already committed to that host — and note Vercel Hobby is non-commercial only.

## Caveats / Risks
- **LGPD vs GDPR nuance (Brazil-specific):** Brazil has **no ePrivacy equivalent**; ANPD's 2022 cookie guide permits **legitimate interest** for aggregate analytics, and truly anonymized analytics fall **outside LGPD** (Art. 12). But "truly anonymized" is a high bar (irreversible, no profiling — Art. 12 §2 keeps behavioral-profile data in scope), and **IP addresses ARE personal data under LGPD**. Cookieless tools sidestep all of this. State your analytics use in your privacy policy regardless. *This is not legal advice.*
- **EU exemption is conditional, not automatic:** France's CNIL (updated guidance announced July 4, 2025, Sheet n°16) exempts audience-measurement trackers from consent only under cumulative conditions (single-site, no cross-site tracking, ≤13-month tracker life, ≤25-month data retention, users still informed with an opt-out). The **UK ICO allows no analytics-cookie exemption** — it requires consent for cookie-based analytics. Cookieless tools (no cookies at all) avoid both regimes; Matomo/GA4 in default cookie mode do not.
- **Pricing/free tiers change often.** All figures verified to ~May–June 2026; re-check official pricing pages before committing. BRL conversions are indicative at USD 1 = BRL 5.04 (June 1, 2026).
- **Umami Cloud is US-hosted** — self-host if EU residency matters; for a Brazil-based personal site this is low-risk. The free tier's **6-month retention** is the main practical limit.
- **Self-hosting TCO is not zero:** ~$5/mo VPS + your time for updates/backups/security. Minor for a personal site but real; managed free tiers avoid it.
- **Cloudflare/GoatCounter/Counter.dev lack event tracking** — they cannot serve the future paid-content conversion use case alone.
- **PostHog/Matomo are heavier** (script + setup); overkill unless you need their depth.
- **Partytown caveat:** offloading analytics scripts to a web worker improves Core Web Vitals but has known reliability pitfalls (some setups silently stop reporting, and Partytown can conflict with consent-management flows) — verify reporting works after each deploy.