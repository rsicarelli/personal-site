# Monetizing rsicarelli.com: A 2025–2026 Landscape Report on Selling Exclusive Paid Content from a Static, Git-Deployed Personal Site

## TL;DR
- **Build the site now on a static-first, edge-capable host (Cloudflare Pages is the right lean given the stated preference — it keeps payment/gating cheapest later because Workers + R2 give you zero-egress file delivery and sub-5ms edge auth at $5/mo), but add NO payment/auth code until you actually have content to sell.** When you monetize, the lowest-risk path is a Merchant-of-Record (MoR) platform — Polar, Lemon Squeezy, or Paddle — that handles global VAT and gates content externally, so your repo stays a pure static "git-as-CMS."
- **For a Brazilian seller, the platform choice splits cleanly: global MoR platforms (Polar/Lemon Squeezy/Paddle ~5%+$0.50) for an international, USD, developer audience (KMP/mobile content) paying out via Wise/Payoneer; or Brazilian platforms (Hotmart/Kiwify ~9–10%) if your buyers are mostly Brazilian and pay Pix/boleto in BRL.** A MoR removes your *foreign* VAT burden but does NOT remove Brazilian income tax — you still owe IRPF (carnê-leão, up to 27.5%) as pessoa física or ~6%+ Simples Nacional once you formalize a CNPJ.
- **Start as pessoa física for validation, but formalize before scaling: MEI permits online-course/e-book sales (CNAE 8599-6/04) but its R$81,000/yr ceiling is low; a CNPJ on Simples Nacional Anexo III (~6% effective starting rate) beats pessoa física's progressive IRPF once monthly income is consistent.** The crossover is driven by income tax, not platform fees.

## Key Findings

### The monetization layer is a "bolt-on," not a re-platform — if you architect statically now
The single most important architectural decision is to keep the site **static-first on a host that also offers serverless/edge functions**. Every monetization model below (one-off products, courses, gated articles, memberships) can be added later as either (a) an externally-hosted checkout/course that you simply link to, or (b) a thin edge-function gate in front of protected assets. Neither requires changing your content pipeline. The git repository remains the source of truth; pushing Markdown still auto-deploys.

### Merchant of Record (MoR) vs. raw payment processor is THE decision that matters
- A **Merchant of Record** is the legal seller. It collects and remits VAT/GST/sales tax worldwide on your behalf, handles fraud, chargebacks, and invoicing. You receive a payout and a "reverse invoice." Examples: **Polar, Lemon Squeezy, Paddle, Gumroad (since Jan 1, 2025), Creem, Hotmart, Kiwify.**
- A **raw payment processor** (Stripe, PayPal) just moves money; *you* are responsible for determining, collecting, and remitting tax in every jurisdiction you sell into. For a solo Brazilian engineer selling globally, raw Stripe means an unmanageable global-tax compliance burden.
- **Verdict for this profile: use a MoR.** The ~2–5% premium over raw Stripe is far cheaper than international tax compliance for a one-person operation.

### Critical 2025–2026 ownership/pricing changes (flag these — older articles are stale)
- **Stripe acquired Lemon Squeezy (announced July 26, 2024).** Deal terms undisclosed; Lemon Squeezy was a 13-person Salt Lake City team that reached $1M ARR nine months after its 2021 launch. Stripe CEO Patrick Collison: *"Welcome @lmsqueezy! We're going to scale merchant of record selling in a big way."* Lemon Squeezy continues to operate as a standalone MoR. Stripe then built **Stripe Managed Payments** — its own native MoR at **5% + $0.50 per transaction**, enabled via a single API parameter in Stripe Checkout, announced February 2026 and entering public preview. Risk: Lemon Squeezy's independent roadmap is now driven by Stripe's priorities; some 2025 Trustpilot reviews report account-freeze and payout issues.
- **Polar restructured pricing in 2026.** Per Polar's official "Introducing Polar Plans" blog (May 20, 2026): the new free "Starter" rate of **5% + $0.50** applies to organizations created **on or after May 27, 2026**; everyone before that is grandfathered to the "Early Member" rate of **4% + $0.40 (plus 0.5% for subscriptions) indefinitely**. Paid tiers buy lower variable rates: **Pro $20/mo (3.8% + 40¢), Growth $100/mo (3.6% + 35¢), Scale $400/mo (3.4% + 30¢)**. +1.5% on non-US cards; $15/chargeback; Stripe payout fees passed through. **Actionable: signing up before May 27, 2026 locks in the cheaper 4%+$0.40 rate permanently.**
- **Gumroad raised fees to a flat 10% + $0.50 and became a true MoR (Jan 1, 2025).** Per Gumroad's pricing page: *"Since January 1, 2025, Gumroad handles ALL your tax obligations… we manage sales tax collection and remittance worldwide."* Discover-marketplace sales are charged at 30%. Effective direct-sale rate ~13% with processing — the most expensive option, justified only by its discovery marketplace.

### Brazil tax reality (the most under-appreciated part)
- **Worldwide income rule:** Brazil taxes residents on worldwide income. USD income from a foreign MoR (Polar/Lemon Squeezy/Paddle) must be declared monthly via **carnê-leão** as "rendimento recebido do exterior," taxed on the progressive IRPF table (top rate 27.5%), with USD→BRL conversion at the Banco Central PTAX rate. Source: Receita Federal Manual do Carnê-Leão (gov.br, updated Oct 2025); IN SRF 208/2002 art. 16.
- **New exemption (Lei 15.270/2025):** Sanctioned Nov 26, 2025 (published DOU Nov 27), in force Jan 1, 2026. Per the Senado Federal, it benefits more than 15 million taxpayers, with more than 10 million no longer paying IRPF. Mechanics: monthly income up to **R$5,000 fully exempt**; partial reduction R$5,000.01–R$7,350 via formula **Redutor = R$978.62 − (0.133145 × monthly gross)**; above R$7,350 the traditional table (7.5/15/22.5/27.5%) applies unchanged. Applies to income earned in 2026 (declared in the 2027 filing); the return filed in 2026 (CY2025) uses old rules.
- **A MoR does NOT change your Brazilian income tax.** It only removes your *foreign* VAT/sales-tax obligation abroad. You still owe IRPF (pessoa física) or Simples (CNPJ) on what you receive. This is a well-supported synthesis of Receita's worldwide-income rule and the MoR platforms' own self-definitions (they explicitly limit their role to indirect/consumption taxes in the buyer's jurisdiction) — not a single verbatim gov.br statement, so confirm specifics with a Brazilian accountant.

### MEI eligibility and the formalization crossover
- **MEI permits this activity:** CNAE **8599-6/04** ("Treinamento em desenvolvimento profissional e gerencial") covers online courses/training and is permitted for MEI; CNAE **5811-5/00** or **4761-0/01** for e-books. **Affiliate** activity is NOT permitted for MEI — but selling your own courses is fine.
- **MEI ceiling: R$81,000/year (≈R$6,750/mo).** Set in 2018 (LC 155/2016) under LC 123/2006 art. 18-A and unchanged for 2025–2026. The Câmara approved urgency for PLP 108/2021 on March 17, 2026 (431 votes, zero against, proposing a R$130k ceiling), but it remains unapproved; PLP 261/2023 proposes ~R$144.9k. Foreign (USD-converted) income counts toward this ceiling, and Resolução CGSN 183/2025 confirmed CPF income from the same activity counts too. In 2024 the Receita Federal de-registered 570,000+ MEIs for exceeding the ceiling, cross-checked via notas fiscais, maquininhas, e-Financeira, and marketplaces.
- **Crossover math:** As pessoa física, income above the exemption is taxed progressively up to 27.5% (plus 20% INSS up to the ceiling). A CNPJ on **Simples Nacional Anexo III** (CNAE 8599-6/04, no Fator R applies) starts at **~6% effective** and rises with revenue. The switch to MEI/CNPJ pays off as soon as monthly income is consistent and above the IRPF exemption band — the saving is on income tax, not platform fees.

## Details

### (A) Payment & Merchant-of-Record platforms

**Polar (polar.sh)**
- *What it is:* Open-source, developer-first billing platform and MoR, launched 2023; GitHub funding partner. Per Polar's site, *"Companies like Tailwind Labs, Midday, Stilla AI & thousands of other SaaS companies have already made the switch."* Native GitHub-repo-access, license-key, Discord-role, and file-download entitlements — a genuine differentiator no other MoR offers, and a strong fit for KMP/code-artifact delivery.
- *Best for:* Developers selling code, courses with downloadable repos, SaaS, and digital products who want a modern API (6-line integration, Next.js/Laravel adapters).
- *Pros:* Developer ergonomics; GitHub-native entitlements; open source (exit path); true MoR (VAT/GST handled); supports one-time, subscription, usage-based.
- *Cons:* 2026 price rise to 5%+$0.50 on the free tier; +1.5% non-US cards; some 2026 Reddit reports of slow support; payouts to ~120 countries only (vs. 220+ elsewhere).
- *Maturity/momentum:* Young but fast-moving; Vercel's CEO Guillermo Rauch is an advisor; strong dev mindshare.
- *Lock-in:* Low-to-moderate — open source, import/export and migration tooling, Stripe underneath.
- *Cost:* Free Starter 5%+$0.50 (4%+$0.40 grandfathered pre-May-27-2026); Pro $20/mo, Growth $100/mo, Scale $400/mo for lower rates. ≈ BRL at ~5.4 BRL/USD: $0.50 ≈ R$2.70; Pro $20/mo ≈ R$108/mo.
- *Brazil payout:* **Yes — via Stripe Connect Express, which supports Brazil even though standalone Stripe is invite-only.** Individuals can sell globally if Stripe Connect Express supports "individual" business type in Brazil (it does). A major advantage for a Brazilian individual.

**Lemon Squeezy (lemonsqueezy.com)**
- *What it is:* MoR for digital products/SaaS, founded 2020, acquired by Stripe July 2024.
- *Best for:* Indie makers selling digital downloads, e-books, courses, and simple subscriptions who want a polished, fast-to-launch storefront.
- *Pros:* Beautiful UX (reportedly higher conversion); true MoR (covers VAT); license keys; affiliate hub; 21 payment methods; bank payouts in 79 countries + PayPal in 200+.
- *Cons:* Headline 5%+$0.50 can climb to 10–18% with add-ons (+1.5% international, +1.5% PayPal, +5% cart recovery, +3% affiliate); future direction tied to Stripe; some 2025 payout-freeze complaints.
- *Maturity/momentum:* Very mature and widely used, but roadmap now Stripe-driven.
- *Lock-in:* Moderate — subscriptions cannot be migrated out directly (only products, customers, license keys, sales data).
- *Cost:* 5% + $0.50 base. Payouts twice monthly (1st/15th), 13-day hold, $50 minimum, bank or PayPal. Bank payouts converted at mid-market rate.
- *Brazil payout:* Yes — bank payout (Brazil supported via Stripe) or PayPal (USD).

**Paddle (paddle.com)**
- *What it is:* Established enterprise-grade MoR powering 4,000+ software companies.
- *Best for:* Scaling SaaS/subscription businesses needing predictable all-inclusive pricing and B2B invoicing; also fine for one-off digital products.
- *Pros:* Single all-inclusive 5%+$0.50 (no PayPal/international surcharges, unlike Lemon Squeezy); 200+ payment methods; full sales-tax liability; mature infrastructure.
- *Cons:* Stricter onboarding/approval; less "indie-friendly"; monthly payouts (slower); owns the customer billing relationship (migration = customer re-acquisition).
- *Maturity/momentum:* Most mature independent MoR; not for sale to Stripe.
- *Lock-in:* High — Paddle is the legal seller; switching means re-subscribing every customer.
- *Cost:* 5% + $0.50 all-in. Payout via **Payoneer** or wire; some countries incur a $15 SWIFT fee; minimum payout threshold $100 (adjustable up to $100,000).
- *Brazil payout:* Yes — via Payoneer or wire (no Brazilian bank or US entity required).

**Gumroad (gumroad.com)**
- *What it is:* Veteran creator platform; true MoR since Jan 1, 2025.
- *Best for:* Creators wanting marketplace discovery and dead-simple setup for one-off digital products.
- *Pros:* Instant setup; built-in audience/discovery; handles VAT.
- *Cons:* 10% + $0.50 (effective ~13%) — most expensive; **does NOT support Payoneer/Wise officially; only local bank deposit or PayPal — and Stripe-connected bank payout is explicitly unavailable in Brazil.** Brazilian sellers are effectively limited to PayPal (USD, 2% fee).
- *Lock-in:* Low (easy to leave) but high fees.
- *Cost:* 10% + $0.50; PayPal payout 2% fee; $100 minimum (PayPal), 7-day hold; weekly payouts (Fridays).
- *Brazil payout:* PayPal only (Stripe bank payout unavailable in Brazil). Weakest Brazil story among global MoRs.

**Creem (creem.io)**
- *What it is:* Newer (2024, Estonia/Armitage Labs) true MoR for digital products/SaaS — issues invoices in its own name and remits VAT.
- *Best for:* Cost-sensitive indie sellers wanting low headline fees and fast onboarding.
- *Pros:* **3.9% + $0.40** (lowest headline among true MoRs), no monthly fee; true MoR; ~100 countries; USDC payout option; 0% fees up to first €1,000 promo.
- *Cons:* Young/less proven; add-ons (+2% splits, +2% affiliate, +5% cart recovery, $25/chargeback); **payout outside the EU (incl. Brazil) costs $7 OR 1% of payout, whichever is higher** — e.g., $50 on a $5,000 payout.
- *Lock-in:* Low but immature.
- *Cost:* 3.9% + $0.40; payouts on the 15th (and/or 1st), $50 minimum; non-EU bank-payout fee max($7, 1%); USDC via Polygon 2%.
- *Brazil payout:* Via Stripe Connect bank transfer (non-EU fee applies) or USDC (2%).

**Stripe (raw processor — NOT a MoR unless using new Managed Payments)**
- *What it is:* The developer-standard payment processor. Stripe Brazil now supports **Pix** (via EBANX partnership, announced Aug 11, 2025) and **boleto** for accepting BRL from Brazilian buyers; Pix is invite-only for Brazil-based businesses. EBANX CEO João Del Valle noted *"93% of Brazilian adults use Pix"* and that merchants offering Pix saw *"a 16% increase in revenue and a 25% growth in consumers within six months."*
- *Best for:* Maximum control, lowest raw fees, when you can handle your own tax — or as the rails under a MoR.
- *Pros:* Best API/DX; 2.9%+$0.30 domestic; Pix/boleto/BRL support; you own the customer relationship.
- *Cons:* **You are responsible for all global tax compliance** — untenable for solo global sales. Pix limits: min R$0.50, max $3,000/transaction, $10,000/buyer/month; IOF 3.5% on cross-border charged to Brazilian buyers of foreign businesses.
- *Lock-in:* Low (industry-standard rails).
- *New:* Stripe Managed Payments (native MoR, 5%+$0.50, public preview from Feb 2026) — worth watching as it matures, since it keeps Stripe's API while adding MoR.

**Memberships/donations:** **Patreon** (memberships, ~8–12% + processing), **Ko-fi** (0% on free tier for tips/memberships), **Buy Me a Coffee** (5%) — relevant if a recurring-support/community model is chosen rather than course sales. These support Payoneer-style routing better than Gumroad for some regions.

### (B) Brazil-specific considerations

**Accepting payment from Brazilian buyers (Pix/boleto/BRL):**
- Global MoRs vary in Pix/boleto support. Stripe (under a MoR or direct) supports Pix + boleto via EBANX. **Brazilian platforms (Hotmart, Kiwify, Eduzz, Monetizze) natively support Pix, boleto, and BRL installments ("parcelamento")** — the dominant local payment behavior — which materially lifts conversion among Brazilian buyers.
- If the audience is primarily international USD-paying developers (likely for KMP/mobile-platform content), Pix matters less and a global MoR is preferable. If a meaningful share of buyers are Brazilian, native Pix/boleto/installments are a real conversion advantage for local platforms.

**Selling internationally in USD & payouts to Brazil:**
- **Polar:** Stripe Connect Express → Brazil supported (individual or company). Strongest combination of global MoR + Brazil payout + developer features.
- **Paddle:** Payoneer or wire to Brazil — no US/intl bank required.
- **Lemon Squeezy:** Bank (Brazil via Stripe) or PayPal (USD).
- **Gumroad:** PayPal only for Brazil (no Stripe bank payout, no Payoneer/Wise officially).
- **Routing:** Wise and Payoneer are the standard tools to receive USD and convert to BRL at near-mid-market rates. Note Wise *personal* accounts require the SWIFT to match country of registration; Wise *business* accounts are more flexible. IOF and FX spreads apply on conversion to BRL.

**Brazilian local platforms (fees, payout, lock-in):**
- **Hotmart:** 9.9–9.99% + R$1/transaction. Largest LATAM ecosystem + affiliate network; sells internationally (12+ currencies, local payment methods); D+2 fast payout globally (except Brazil), D+15 standard. USD/EUR min withdrawal $20/€20 + $1.99 fee; Payoneer for international. **2024–2025 model change:** since July 1, 2024, Hotmart is "agent of the producer" — producers are now responsible for their own tax assessment, collection, remittance, and invoicing per sale (Hotmart only invoices its service fee). Reports transaction values to Brazilian fiscos via DIMP.
- **Kiwify:** ~8.99% + R$2.49 (some sources cite a 3.89%/3.99% lower tier or a paid-monthly zero-fee plan). Netflix-like members' area praised; instant Pix, card in 2 days; no max PF withdrawal cap. Issues a service-fee nota fiscal to producer by the 10th.
- **Eduzz:** 4.9% + R$1 direct sales (8.9% + R$1 via affiliate); R$9 withdrawal fee; charges even on refunded sales (negative-balance risk); PF withdrawal cap ~R$2,250/mo.
- **Monetizze:** 7.99% + R$1.50; broad affiliate/physical-product support; PF withdrawal cap ~R$1,900–2,250/mo.
- **Lock-in:** Local platforms host your members' area and own the checkout — moving means rebuilding. Higher fees but native Pix/boleto/BRL installments and Brazilian-buyer trust.
- **Nota fiscal:** On Hotmart/Kiwify the **producer** must issue the NFS-e to the final buyer; the platform only invoices its own fee. As pessoa física there is no NF issuance but carnê-leão applies; as CNPJ you issue NFS-e and pay Simples.

### (C) Monetization models mapped to KMP/mobile-engineering content
- **One-off digital products** (a KMP starter template, a Gradle convention-plugins pack, an e-book/PDF, sample code repo): Any MoR. Polar's GitHub-repo-access + file-download + license-key entitlements fit code artifacts best. Gumroad for discovery.
- **Paid courses** (recorded video + PDF + downloadable code): Self-built (MoR + video host + edge gate) OR hosted course platform — see (E).
- **Gated/premium articles:** Edge-function gate (Cloudflare Worker) checking a token/entitlement from your MoR, or a membership platform. Lowest-complexity: keep premium articles as separate pages gated by a Worker that validates a Polar/Lemon Squeezy license or a Cloudflare Access policy.
- **Subscriptions/memberships:** Polar, Lemon Squeezy, Paddle (subscriptions), or Patreon/Ko-fi for community-style. Pix Automático (2025) now enables recurring Pix for Brazilian subscribers.
- **Pay-what-you-want:** Lemon Squeezy and Gumroad support PWYW natively; Ko-fi for tips.

### (D) Content gating / auth on a static or hybrid site
The principle: **keep public content static and fast; gate only the paid subset via an edge function or an external platform.** Options, lowest-to-higher complexity:

1. **External platform handles gating (lowest complexity).** Sell/host the course on Polar/Lemon Squeezy/a course platform; your static site just links out. Zero auth code in your repo. Best first step.
2. **MoR license key + edge validation.** Buyer gets a license key (Polar/Lemon Squeezy issue these); a Cloudflare Worker validates the key via the MoR API and serves a signed URL to the protected asset in R2. Keeps static deploy intact; minimal serverless surface.
3. **Signed URLs for protected downloads/video.** Store paid PDFs/code/video in **Cloudflare R2** (S3-compatible, **zero egress fees** — a major cost advantage for file-heavy delivery) or S3; a Worker issues time-limited signed URLs only to entitled users. For video, pair with a streaming host (see E).
4. **Lightweight auth provider** (if you build a real members' area):
   - **Cloudflare Access** — zero-trust gate in front of routes; simplest if already on Cloudflare; good for small gated sections.
   - **Supabase Auth** — free up to 50,000 MAU; includes Postgres + Row Level Security; best if you want a DB too. $25/mo Pro.
   - **Clerk** — best drop-in UI components; free up to 10,000 MAU, then $0.02/MAU. Fastest to a polished sign-in.
   - **Auth0** — enterprise SSO; overkill and most expensive (~$0.07/MAU).
   - **Lucia/self-rolled** — maximum control, more maintenance.
- **Host comparison for gating (the clarified question):** All three hosts support serverless/edge functions, so all keep the gating path open. **Cloudflare Workers** win on cost and latency: V8 isolates with sub-5ms cold starts, $5/mo Workers Paid bundling Workers + KV + D1 + R2 + Durable Objects, **unlimited bandwidth**, and **R2's zero egress** (critical when serving paid video/downloads). **Vercel Functions** are excellent for Next.js SSR but bandwidth/egress get expensive and the Hobby tier forbids commercial use. **Netlify Functions** are solid and framework-agnostic but bandwidth overages and a 300-build-minute free cap bite. **For a static-first site that will later gate paid content and serve protected files, Cloudflare Pages + Workers + R2 is materially the cheapest and simplest** — it does not change the platform recommendation but reinforces the Cloudflare lean. The only scenario that would change it: if you later build a full Next.js SSR app, Vercel becomes more attractive.

### (E) Course delivery specifically
**Self-built (MoR + video host + gate):**
- **Video hosting cost math** (the key constraint): A 60-min 1080p video watched by 1,000 users ≈ 60,000 delivered minutes.
  - **Cloudflare Stream:** $5/1,000 min stored + $1/1,000 min delivered → ~$0.30 storage + ~$60 delivery for that example. Encoding included; simplest if on Cloudflare.
  - **Mux:** per-minute storage + delivery; best analytics (Mux Data), best DX, per-title "Smart" encoding (20–40% smaller files); slightly cheaper delivery than Stream but more complex pricing. $20/mo free credit.
  - **Bunny Stream:** ~$0.005/GB CDN + ~$0.02/min encoding — **cheapest at scale** (often ~half of Cloudflare Stream); supports DRM (Widevine/FairPlay); some advanced-protection limits.
  - **Self-hosted (PeerTube + Hetzner/R2):** cheapest raw storage/bandwidth but most ops burden; not recommended for a solo maintainer who wants to focus on content.
- *Where self-built breaks down:* You assemble checkout (MoR) + video host + gate + members' UI yourself. Fine for a technical owner, but real maintenance. Best when you want full control, lowest fees at scale, and brand ownership.

**Hosted course platforms (embedded/linked):**
- **Teachable:** Restructured June 2025 (free plan killed). Starter $29–39/mo with **7.5% transaction fee** + 1-product cap + 100-student cap; Builder $69–89/mo (0% transaction fee) is the real starting tier; handles EU/UK VAT. Crossover: upgrade to Builder once revenue exceeds ~$667/mo (annual billing ~$533/mo).
- **Thinkific:** Free plan (1 course, 0% transaction fee, unlimited students); Basic ~$36–49/mo; Start ~$99/mo (memberships, payment plans). **Zero transaction fees on all paid plans** — best value as you scale. Does NOT handle VAT for you.
- **Podia:** Mover ~$33–39/mo (5% fee), Shaker ~$75–79/mo (0% fee); unlimited products from entry tier; built-in email marketing.
- **Kajabi:** All-in-one (site + email + courses), zero transaction fees, from ~$89/mo — pricier, business-focused.
- **Hotmart (course + checkout + members' area):** Native Brazilian course delivery with Pix/boleto + members' area; 9.9% + R$1. Best if Brazilian audience.
- **Self-hosted LMS (Moodle/LearnDash):** Maximum control, most ops; not recommended here.
- *Where hosted platforms break down for THIS content mix:* Course platforms are optimized for video + quizzes, not for **downloadable code repos, Gradle artifacts, or license-gated GitHub access**. A KMP course with heavy code/artifact distribution is awkward on Teachable/Thinkific — this is exactly where **Polar (GitHub-repo entitlements + file downloads) + a dedicated video host** beats a generic course platform. They also don't handle Brazilian nota fiscal.

### (F) Minimal architectural choices NOW (and what NOT to build)
**Do now (keeps cheapest path open, no premature complexity):**
- Build the static bilingual site on **Astro** (zero-JS by default, excellent SEO, mature i18n via file-based routing + content collections, Markdown/MDX content = git-as-CMS). Astro's content-collections structure (`src/content/blog/en/`, `/pt/`) maps directly to your bilingual requirement and a future Decap-CMS option.
- Host on **Cloudflare Pages** (unlimited bandwidth, free tier, Workers/R2 available) — git push auto-deploys. DNS: point rsicarelli.com at Cloudflare.
- **Bilingual default-to-browser-locale:** implement hreflang tags, localized URLs (`/pt/...`, `/en/...`), and locale detection — Astro i18n + a small Cloudflare Worker reading `Accept-Language` does this cleanly without breaking static generation.
- **SEO + AI discoverability (first-class):** server-render static HTML (Astro does this), add JSON-LD structured data (Person, Article, Course, Event schema), a clean sitemap.xml, and an **llms.txt** file. Caveat: evidence that LLM crawlers actually fetch llms.txt is currently weak — major AI crawlers (GPTBot, ClaudeBot, PerplexityBot) largely ignore it as of mid-2025, and Google has not committed to crawling it. AI discoverability is driven more by structured data, content clarity, entity authority, and being cited elsewhere. Implement llms.txt (it's cheap) but invest primarily in structured data + high-quality, clearly-written content.
- Structure the repo so paid content could live in a separate `premium/` collection later, served via a Worker — but don't build the gate yet.

**Do NOT do now (premature complexity):**
- Do NOT add auth, user accounts, a database, or a members' area.
- Do NOT integrate a payment processor or build checkout.
- Do NOT set up video hosting or DRM.
- Do NOT formalize a CNPJ before you have validated demand (start pessoa física).
- Do NOT pick a course platform until you know your content format and audience split (BR vs. international).

## Comparison table (main platforms)

| Platform | Fee (% + fixed) | MoR? | Pix/boleto (BR buyers) | Brazil payout | Lock-in | Best for |
|---|---|---|---|---|---|---|
| **Polar** | 5% + $0.50 (4%+$0.40 grandfathered pre-27-May-26) | Yes | Limited (Stripe rails) | **Yes — Stripe Connect Express** | Low (open source) | Devs selling code/courses, GitHub entitlements |
| **Lemon Squeezy** | 5% + $0.50 (climbs w/ add-ons) | Yes | Limited | Yes (bank/PayPal) | Moderate (subs not portable) | Indie digital products, fast launch |
| **Paddle** | 5% + $0.50 all-in | Yes | 200+ methods | Yes (Payoneer/wire) | High (legal seller) | Scaling SaaS/subscriptions |
| **Gumroad** | 10% + $0.50 | Yes | Limited | **PayPal only (weak)** | Low | Marketplace discovery, one-offs |
| **Creem** | 3.9% + $0.40 | Yes | Some | Yes (non-EU fee max($7,1%)) | Low (young) | Cost-sensitive indies |
| **Stripe (raw)** | 2.9% + $0.30 | No (you owe tax) | **Yes (Pix+boleto via EBANX)** | Invite-only direct | Low | Control; rails under MoR |
| **Hotmart** | 9.9% + R$1 | Yes (BR) | **Yes native + installments** | Yes (BRL/Payoneer) | High | Brazilian audience, courses |
| **Kiwify** | ~8.99% + R$2.49 | Yes (BR) | **Yes native, instant Pix** | Yes (BRL) | High | Brazilian course sellers |
| **Eduzz** | 4.9% + R$1 (direct) | Yes (BR) | **Yes native** | Yes (BRL, R$9 fee) | High | BR direct sales, high ticket |

## Shortlist of top candidates (with rationale)
1. **Polar — top pick for this profile.** Best fit for an international developer audience selling KMP/mobile-engineering content: true MoR (no foreign-VAT burden), unique GitHub-repo/license/file-download entitlements for code artifacts, modern API, open-source exit path, and — critically — **Brazil payout via Stripe Connect Express**. Sign up before May 27, 2026 to lock the 4%+$0.40 rate.
2. **Lemon Squeezy — strong runner-up for fast, polished launches** of simple digital products and subscriptions. Watch the Stripe-ownership uncertainty and the add-on fee creep.
3. **Paddle — pick if you scale into subscriptions** and want predictable all-in pricing with Payoneer payout; accept the high lock-in.
4. **Hotmart or Kiwify — pick the moment a meaningful share of buyers are Brazilian.** Native Pix/boleto/installments and local trust outweigh the higher (~9–10%) fees for the BR market; can run in parallel with a global MoR.

## Decision framework (which choice fits which priority)
- **Global developer audience, code artifacts, lowest tax-compliance burden:** Polar.
- **Fastest polished launch, simple digital products:** Lemon Squeezy.
- **Predictable all-in pricing, subscriptions at scale:** Paddle.
- **Brazilian buyers, Pix/boleto/installments, local trust:** Hotmart or Kiwify.
- **Absolute lowest headline fee:** Creem (accept immaturity + non-EU payout fee).
- **Lowest delivery cost for heavy video:** Bunny Stream + R2.
- **Simplest gating on Cloudflare:** Cloudflare Access / Worker + R2 signed URLs.
- **No stack maintenance for courses:** Thinkific (0% transaction fee) or Podia.

## Recommendations (staged, with thresholds)

**Phase 0 — Now (build the hub, monetization dormant):**
- Astro static site on Cloudflare Pages, bilingual (pt-BR + en) defaulting to browser locale, git-as-CMS via Markdown content collections. DNS wired to Cloudflare. JSON-LD structured data + sitemap + llms.txt. Cost: ~R$0 (free tiers) + domain (already owned).
- **Benchmark to advance:** You have a finished piece of paid content (a course module or premium-article series) AND evidence of demand (audience asking, waitlist signups, inbound).

**Phase 1 — First paid product (lowest risk, pessoa física):**
- Sell a single one-off digital product (e-book/PDF or code pack) through a **global MoR**, using the **external-platform-handles-everything** model — link out from the static site; zero auth code.
- **Platform pick:** **Polar** if buyers are international developers (GitHub entitlements + Brazil payout + grandfathered 4%+$0.40 if you sign up before May 27, 2026). **Hotmart or Kiwify** if early buyers are mostly Brazilian (native Pix/boleto/installments).
- Tax: declare via carnê-leão monthly; route USD via Wise/Payoneer.
- **Benchmark to advance:** Consistent monthly income above the IRPF exemption band (R$5,000/mo from 2026) OR approaching R$81,000/yr.

**Phase 2 — Formalize + scale to courses:**
- Open a CNPJ. Start MEI (CNAE 8599-6/04) if annual revenue will stay under R$81k; otherwise go straight to **Microempresa on Simples Nacional Anexo III (~6% start)**. Engage an accountant specialized in infoprodutos (e.g., Tactus, Contabilizei).
- For a video course with downloadable code: **self-built stack** — MoR (Polar/Lemon Squeezy) for checkout + **Bunny Stream** (cheapest) or **Cloudflare Stream** (simplest) for video + **Cloudflare R2** (zero-egress) for code/PDF behind Worker-issued signed URLs. OR a hosted platform (**Thinkific** for zero transaction fees) if you'd rather not maintain the stack.
- **Benchmark to change course:** If video delivery exceeds ~tens of thousands of minutes/month, Bunny Stream's per-GB model wins; if you need analytics, Mux. If a large Brazilian audience emerges, run Hotmart/Kiwify in parallel for the BR market.

**Phase 3 — Memberships/recurring (optional):**
- Add subscriptions (Polar/Lemon Squeezy/Paddle) or community memberships (Patreon/Ko-fi). Pix Automático enables recurring Pix for Brazilian subscribers.

## Key risks & trade-offs
- **Platform consolidation risk:** Lemon Squeezy's independence post-Stripe is uncertain; Polar is young (and just raised prices); Creem is younger. Mitigate by choosing MoRs with export/migration tooling (Polar is open source) and avoiding deep lock-in (Paddle's "legal seller" model is hardest to leave).
- **Brazil tax exposure:** A MoR does NOT remove Brazilian income tax. Failing to declare foreign income via carnê-leão risks malha fina — Receita cross-checks via DIMP, e-Financeira, and marketplace reporting. Engage an accountant before scaling.
- **MEI ceiling trap:** R$81k is easy to exceed with a successful course; exceeding by >20% triggers retroactive Simples taxation with interest. Watch the ceiling monthly; formalize as ME before crossing.
- **Currency/IOF/FX drag:** USD→BRL conversion incurs FX spread and IOF; Wise/Payoneer minimize but don't eliminate this. Gumroad's PayPal-only Brazil payout is the weakest.
- **Content-fit mismatch:** Generic course platforms handle video well but not code/license/GitHub distribution — don't lock into Teachable/Thinkific for a code-heavy KMP course without testing artifact delivery first.
- **AI-discoverability overinvestment:** llms.txt is unproven; structured data + content quality + external citations drive AI visibility more.

## Caveats
- Platform fees and tiers change frequently; verify current pricing on each platform's pricing page before committing (especially Polar's post-May-2026 tiers, Stripe Managed Payments GA status, and Teachable's post-2025 structure).
- BRL conversions use ~5.4 BRL/USD as a rough reference; actual rates fluctuate.
- The "MoR does not remove Brazilian income tax" conclusion is a well-supported synthesis of Receita Federal's worldwide-income rule and MoR platforms' self-definitions, not a single verbatim gov.br statement — confirm specifics with a Brazilian accountant.
- MEI ceiling-raise bills (PLP 108/2021, PLP 261/2023) were not approved as of this report; the ceiling remains R$81,000 (Câmara approved urgency for PLP 108/2021 in March 2026, but not the bill itself).
- Lei 15.270/2025's R$5,000 monthly exemption applies to income earned from Jan 1, 2026 (declared in 2027); the 2026 filing (CY2025) uses prior rules.
- This is a research/landscape report for decision-making, not tax, legal, or financial advice.