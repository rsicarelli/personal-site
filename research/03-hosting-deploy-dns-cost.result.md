# Hosting, Auto-Deploy, DNS, Email & Total Cost for rsicarelli.com — A 2025–2026 Landscape Report

**Currency note:** USD figures are converted to BRL at **R$5.04 per US$1** (the spot rate on June 1, 2026, per Exchange-Rates.org). The real traded between ~R$4.91 and ~R$5.52 during 2026, so treat BRL figures as ±10% approximations.

## TL;DR
- **The cheapest robust setup that meets every constraint is ~US$0–1/month (R$0–5):** host the static, bilingual site on **Cloudflare (Pages today, Workers Static Assets going forward)** with native git auto-deploy, use **Cloudflare as your DNS provider regardless of host** (apex via CNAME flattening + www CNAME, free TLS), and use **Cloudflare Email Routing (free, unlimited forwarding)** for receiving `hello@rsicarelli.com`, paired with Gmail "send-as" or a paid sender if you need outbound from the domain. Domain renewal at Cloudflare Registrar is at-cost (~US$10.44/yr ≈ R$53).
- **For an image/material-heavy site, Cloudflare is the only major host with no bandwidth/egress fees** — Pages/Workers static-asset bandwidth is unlimited and free, and large downloads belong in **Cloudflare R2 (zero egress, 10 GB free)**. This structurally avoids the Vercel ($0.15/GB after 1 TB) and Netlify ($0.55/GB, or ~20 credits/GB) overage-bill risk that has burned image-heavy sites.
- **Keep DNS at Cloudflare to stay portable.** Because DNS sits independently of the host, you can later move the front-end to Vercel/Netlify/GitHub Pages or add a Cloudflare Workers ($5/mo) dynamic backend for selling courses, without re-architecting. Lock-in is low across all static hosts (output is just HTML/CSS/JS in your repo).

## Key Findings

1. **Static + git-as-CMS is the correct architecture.** Every requirement (blog, CV, portfolio, events, photo galleries, downloads, bilingual) is satisfiable by a static site generator with native i18n. The two best fits for a Kotlin/TS/Rust-fluent owner are **Astro** (TypeScript, island architecture, ships zero JS by default, excellent i18n + SEO control) and **Hugo** (single Go binary, fastest builds, i18n out of the box). Both pre-render HTML, which is mandatory for both Google SEO and AI crawlers (which largely do not execute JavaScript).

2. **Cloudflare's no-egress-fee model is the decisive cost differentiator** for a photo/downloads site. Vercel Hobby caps at 100 GB/month then *pauses the site* (no overage on free tier); Vercel Pro includes 1 TB then bills **$0.15/GB** (confirmed on vercel.com/pricing, plus a separate $0.06/GB Fast Origin Transfer meter charged from the first byte). Netlify's 2025 credit model bills bandwidth at **~$0.55/GB (~20 credits/GB)** — and is the source of widely reported surprise bills. Cloudflare Pages/Workers serve static assets with **unlimited, free bandwidth**.

3. **DNS topology should be Cloudflare-centric and host-agnostic.** Delegate `rsicarelli.com`'s nameservers to Cloudflare (full setup). Cloudflare's **CNAME flattening** lets the apex behave like a CNAME to any host, free TLS (Universal SSL) covers apex + www automatically, and you can repoint to any platform by editing one or two records.

4. **Email: forwarding is free and sufficient to start; a real mailbox costs little.** Cloudflare Email Routing gives unlimited free forwarding (receive-only). For sending *as* the domain with good deliverability, add Zoho Mail's free tier (1 domain, 5 users, 5 GB, webmail-only) or a low-cost mailbox (Migadu, Fastmail). SPF/DKIM/DMARC must be configured regardless.

5. **A dynamic backend for paid courses is a later, additive step, not a hosting decision now.** A Merchant-of-Record checkout (Lemon Squeezy, Polar, Gumroad) needs zero backend — just links from the static site — and handles global VAT. If you later want custom logic, Cloudflare Workers ($5/mo) + D1/KV/R2 sits natively alongside the same site.

## Details

### A. The auto-deploy / hosting landscape (2025–2026)

#### Cloudflare Pages / Workers (Static Assets) — **top pick**
- **What it is:** Static + JAMstack hosting on Cloudflare's global edge. **Note the strategic shift:** in its Developer Week 2025 blog post ("Your frontend, backend, and database — now in one Cloudflare Worker"), Cloudflare stated: "*Now that Workers supports both serving static assets and server-side rendering, you should start with Workers. Cloudflare Pages will continue to be supported, but, going forward, all of our investment, optimizations, and feature work will be dedicated to improving Workers.*" Cloudflare's Workers Tech Lead Kenton Varda clarified on Hacker News that Pages is **not** being sunset: "*This is a bit of a misunderstanding. We are not sunsetting Pages. We are taking all the Pages-specific features and turning them into general Workers features... At some point — when we can do it with zero chance of breakage — we will auto-migrate all Pages projects to this new implementation, essentially merging the platforms.*" **Practical guidance:** Pages remains the simplest choice for a content-first site today (Git connect, push, done, free preview deploys per branch); Workers Static Assets is the forward-looking equivalent and worth choosing if you want to be on the actively-developed path. (Note: Workers Sites, the older static approach, is deprecated — do not use it for new projects.)
- **Pipeline:** Native Git integration — connect the GitHub repo, set build command + output dir, every push to `main` builds & deploys; every branch/PR gets a preview URL. No GitHub Actions needed (though you can use them).
- **Free tier:** **Unlimited bandwidth and requests**; **500 builds/month**; 1 concurrent build; up to 20,000 files/site (100,000 on paid); 25 MiB max per file; 100 custom domains/project. No credit card.
- **Paid:** Pages Pro tiers exist for more builds; Workers Paid is **$5/mo** minimum (10M requests/mo included, +$0.30/M; 30M CPU-ms/mo, +$0.02/M; **no egress charges**). Requests to static assets are free and unlimited even on the paid plan.
- **Brazil/LATAM:** Cloudflare operates data centers in **São Paulo (GRU) and Rio de Janeiro (GIG)**, plus many other Brazilian cities (Belo Horizonte, Brasília, Curitiba, Fortaleza, Porto Alegre, Recife, Salvador, Goiânia, and more). Cloudflare states on its network page: "*95% of the world's Internet-connected population is within 50 milliseconds of a Cloudflare data center — most are within 20ms.*" This is the strongest LATAM edge presence of any host here.
- **Custom domain + TLS:** Free Universal SSL covers apex + first-level subdomains incl. www. (DNS details in §C.)
- **Scaling cost:** Essentially flat at $0 for a static site no matter how viral. Adding dynamic backend = $5/mo Workers + usage.
- **Lock-in / exit:** Very low. Output is standard static files in your repo; DNS is portable. Pages-specific `_headers`/`_redirects` are also supported by Workers.
- **Best for:** This project exactly — bilingual static hub, image galleries, downloads, Brazilian audience, cost-sensitive, technical owner.

#### Vercel
- **What it is:** Premier Next.js/frontend host with the slickest DX and preview deploys.
- **Pipeline:** Native Git integration; automatic preview URLs per PR; build minutes metered (Standard $0.014/min).
- **Free (Hobby):** 100 GB bandwidth/mo, 1M edge requests, 1M function invocations, 4 CPU-hours; **non-commercial use only** (a hard blocker once you sell courses); hitting a limit **pauses** the project (no overage).
- **Paid (Pro):** **$20/seat/mo** (≈ R$101) with a $20 usage credit; 1 TB bandwidth included, then **$0.15/GB** (≈ R$0.76/GB). Commercial use allowed.
- **Brazil:** Has a São Paulo (GRU1) region; good but egress-billed.
- **Cons / lock-in horror stories:** Bandwidth overages are the classic surprise bill ("$550/TB" complaints on HN); image-heavy/downloads sites are exactly the risk profile. Hobby's non-commercial clause means selling anything forces Pro. Moderate lock-in if you use Vercel-specific features (ISR, KV, Blob).
- **Best for:** Next.js apps with funding; **not** the cost-optimal choice here. A common mitigation is putting Cloudflare's free CDN in front of Vercel to cache heavy assets.

#### Netlify
- **What it is:** The original JAMstack host; strong build plugins, forms, deploy contexts.
- **Pipeline:** Native Git; deploy previews; **credit-based billing since Sept 4, 2025** (refined again April 14, 2026 — Pro is now flat-fee with unlimited members). Accounts created before Sept 4, 2025 can stay on legacy plans.
- **Free:** 300 credits/mo (hard cap, no auto-recharge) — roughly the old 100 GB bandwidth / 300 build minutes / 125k function invocations. A **deploy costs 15 credits**, **1 GB bandwidth costs ~10–20 credits**. Hitting the cap pauses sites until the next month.
- **Paid:** Personal $9/mo (1,000 credits); Pro ~$19–20/mo (3,000 credits). Bandwidth overage is **~$0.55/GB ($55/100 GB)** on legacy terms — **the most expensive bandwidth of the majors**, and the source of well-known surprise-bill complaints.
- **Brazil:** Uses a global CDN but **no dedicated Brazil POP** comparable to Cloudflare's; LATAM latency is weaker.
- **Lock-in / exit:** Low for static output; credit model makes cost prediction hard. Users report friction downgrading from paid back to Free.
- **Best for:** Teams wanting Netlify's form/identity ecosystem; **cost-risky for image/download-heavy sites**.

#### GitHub Pages
- **What it is:** Free static hosting directly from a GitHub repo — maximally "git-as-CMS."
- **Pipeline:** Push to branch → deploy; with a **custom GitHub Actions workflow** you can build any SSG (Astro/Hugo) and bypass the 10-builds/hour soft limit. The owner already knows GitHub Actions.
- **Limits:** **100 GB/month soft bandwidth limit**; repo soft limit ~1 GB; **explicitly not allowed for primarily-commercial / e-commerce sites** — a real blocker for selling courses from the same property. No native preview deploys for PRs.
- **Brazil:** Served via Fastly CDN; decent but no Brazil-specific guarantee, and the 100 GB cap is risky for galleries/downloads.
- **TLS/domain:** Free TLS, custom apex + www supported.
- **Lock-in / exit:** Essentially zero.
- **Best for:** A pure free blog/portfolio; **the commercial-use restriction and 100 GB cap make it a weaker fit** than Cloudflare for this specific multi-purpose, eventually-commercial hub.

#### Render
- Free static sites + web services; **free web services spin down after 15 min idle (30–60s cold start) since Sept 1, 2025**; 750 instance-hours/mo; free Postgres expires after 30 days. Git auto-deploy from GitHub/GitLab/Bitbucket. Better as a **dynamic backend** option than a static host. Paid web service $7/mo to stay warm; Pro instances $25/mo. No Brazil region (US/EU/Singapore/Frankfurt).

#### Fly.io
- Container/micro-VM platform, `flyctl` + Dockerfile (not git-push-native). **Free tier removed for new users; credit card required.** Pay-as-you-go: machines from ~$2/mo, **egress $0.02/GB (NA/EU), higher elsewhere** ($0.04–$0.12/GB). Has a São Paulo (GRU) region. Best for a globally-distributed dynamic backend, **overkill for a static personal site**.

#### Deno Deploy
- Edge JS/TS serverless; free tier (1 GB KV, 100 GB transfer, 1M requests, commercial OK). Great if you want a TypeScript edge backend later; not a git-as-CMS static host in the Pages/Netlify sense.

#### Object storage + CDN (the "no surprise egress" pattern for big files)
- **Cloudflare R2:** S3-compatible, **zero egress fees, ever**; free tier **10 GB storage, 1M Class A + 10M Class B ops/month**; then $0.015/GB-mo storage. Native to Cloudflare CDN/Workers. **Best home for large downloadable materials and big galleries.**
- **Backblaze B2:** Cheapest storage (~$6/TB-mo); **3× monthly-storage free egress**, and **unlimited free egress through Cloudflare/Bandwidth Alliance partners**; direct egress beyond the allowance is $0.01/GB. Excellent for archival/large files if paired with Cloudflare.
- **AWS S3 + CloudFront:** Mature but **egress ~$0.09/GB** — the expensive, classic-surprise-bill option; only worth it if already in AWS.
- **Verdict:** For this site, serve the website itself from Cloudflare Pages/Workers and put **heavy downloads/galleries in R2** (or B2-behind-Cloudflare). Egress stays free.

#### Self-hosted (VPS)
- Hetzner CX22 ~€4.59/mo (≈ R$26) + Coolify for a Heroku-like git-push experience. Cheapest for *many* apps on one box, but you patch the OS, manage TLS, and own uptime. **Not recommended** for a personal site when Cloudflare is free and zero-ops — but a valid future option for a heavy dynamic backend.

### B. Static site generator & bilingual (pt-BR + English) + AI/SEO

- **Astro** — recommended primary: TypeScript-native (matches the owner's stack), island architecture ships near-zero JS for fast Core Web Vitals, first-class i18n routing with locale detection, fine-grained `<head>`/metadata/structured-data control, and Cloudflare adapter for optional SSR. Strong momentum (one of the fastest-growing SSGs).
- **Hugo** — recommended alternative: single Go binary, fastest builds, i18n bundles out of the box, built-in image processing (useful for galleries), mature/stable.
- **Bilingual default-to-browser-locale:** Both SSGs support locale-prefixed routes (`/pt/`, `/en/`); browser-locale default is done via an edge redirect (Cloudflare Worker / `_redirects` reading `Accept-Language`) or a small client-side redirect. Emit `hreflang` tags for SEO.
- **AI/LLM discoverability — be realistic:** Server-rendered/static HTML is the single biggest lever — AI crawlers (GPTBot, ClaudeBot, PerplexityBot) largely **do not run JavaScript**, so SSG output is ideal. **`llms.txt` is low-cost but low-proven:** Google's John Mueller stated on Bluesky (June 17, 2025): "*FWIW no AI system currently uses llms.txt. It's super-obvious if you look at your server logs. The consumer LLMs/chatbots will fetch your pages — for training and grounding, but none of them fetch the llms.txt file.*" Independent log audits confirm major LLM bots don't request it; its real value is for AI coding tools (Cursor/Copilot) fetching docs. **What actually works:** clean HTML, content that directly answers questions, allowing AI crawlers in `robots.txt`, consistent entity/naming, and traditional SEO authority. Per Conductor's 2026 AI referral benchmark (across 13,770 domains and 10 industries, reported by Digiday), **ChatGPT drives 87.4% of all AI referral traffic on average**, while **only ~1.08% of web traffic came from AI answer engines** — meaningful and growing, but still a small slice today.

### C. DNS wiring for rsicarelli.com (already owned)

**Recommended topology: delegate nameservers to Cloudflare (full setup) and keep DNS there regardless of where you host.** This maximizes portability and unlocks free CNAME-flattening + TLS.

- **Apex (`rsicarelli.com`):** Cloudflare requires the domain be added as a zone with nameservers pointed to Cloudflare; it then **auto-creates a (flattened) CNAME at the apex** pointing to your `*.pages.dev` hostname. Per Cloudflare docs, CNAME flattening "*is also what allows you to use a root custom domain with a Cloudflare Pages site*" and "*occurs by default for all plans when your domain uses a CNAME record for its zone apex.*"
- **www (`www.rsicarelli.com`):** a **CNAME → `<your-site>.pages.dev`**, added automatically once the zone is on Cloudflare. (Add both apex and www in the Pages dashboard so they resolve; manually adding the CNAME without registering the domain in Pages yields a 522 error.)
- **TLS:** Free Universal SSL auto-issues within 15 min–24 h, covering apex + www. No action and no cost.
- **If you ever host elsewhere with Cloudflare still as DNS:** apex uses CNAME flattening to the vendor hostname (or vendor A/AAAA records); www is a normal CNAME to the vendor. **Partial (CNAME-only) setup works only for subdomains, not the apex**, so full setup is preferred.
- **Registrar:** Optional but tidy — transfer to **Cloudflare Registrar**, which sells/renews at **wholesale, no markup** ("*You pay what we pay*"); a `.com` is **~US$10.44/yr (≈ R$53)** — registry + ICANN fee, same at renewal. (Cloudflare doesn't publish the exact figure on marketing pages; verify at checkout. Registrar domains must use Cloudflare nameservers, which you're doing anyway.)

### D. Email for hello@rsicarelli.com

**Receiving (free, recommended to start):**
- **Cloudflare Email Routing** — **free, unlimited forwarding**; create `hello@rsicarelli.com` → your personal Gmail/inbox. Auto-adds MX + SPF records. Since **July 3, 2025, Cloudflare requires forwarded mail to pass SPF or DKIM** and recommends DMARC; it provides a free DMARC Management tool (available on all plans). Receive-only (no mailbox, no native sending).

**Sending as the domain (pick one):**
- **Gmail "Send mail as" via Gmail SMTP** — free; works ~95% of the time but mail is DKIM-signed as `gmail.com`, so strict recipients (Yahoo/Outlook) may flag it. Add `include:_spf.google.com` to the existing Cloudflare SPF record.
- **Zoho Mail Forever Free** — **$0**, real mailbox: **1 custom domain, up to 5 users, 5 GB each, ad-free, webmail/mobile only (no IMAP/POP), no forwarding** on free tier. Proper DKIM as your domain → good deliverability. Best free way to *send* as `hello@rsicarelli.com`. (Mail Lite at ~$1/user/mo unlocks IMAP/POP.)
- **Migadu** — flat pricing by volume (not per-mailbox), unlimited domains/mailboxes/aliases; Micro plan ~US$19/yr (≈ R$96). Great for a developer who values control.
- **Fastmail** — from **$5/user/mo** (≈ R$25) (Basic ~$4/mo billed annually); polished, JMAP, masked aliases, excellent deliverability. The "best all-round" pick if you want a premium mailbox.
- **Dedicated SMTP (if you send transactional/marketing):** SMTP2GO/Brevo/Mailgun free tiers for guaranteed delivery.

**Deliverability setup (do this regardless):** Publish **SPF** (`v=spf1 include:_spf.mx.cloudflare.net include:<sender> ~all` — one combined record, never two SPF records), **DKIM** (CNAME/TXT from your sending provider), and **DMARC** (start `p=none`, then tighten to quarantine/reject). Keep these DNS records **DNS-only (grey cloud)**, not proxied.

### E. Selling paid content later (courses/exclusive content)

- **No backend needed to start:** Use a **Merchant-of-Record** so you don't handle global VAT/tax:
  - **Polar** — **4% + $0.40/transaction**, developer-focused, open-source, MoR. Lowest fees of the three.
  - **Lemon Squeezy** — **5% + $0.50** (now part of Stripe); MoR; note add-ons can raise effective rate (+1.5% international, +1.5% PayPal).
  - **Gumroad** — simplest but **10%** (a "growth penalty" at scale).
- Embed checkout links/buttons in the static site; deliver downloads via R2 signed URLs or the MoR's own delivery/license features.
- **If you want custom logic** (gated content, accounts): add **Cloudflare Workers ($5/mo) + D1 (SQLite) + KV + R2** alongside the same site — D1 free tier 5 GB / 5M row-reads per day, KV free 100k reads/day, R2 free 10 GB, all with **no egress fees**. This is the lowest-friction path given the existing Cloudflare DNS/hosting.

## Comparison Table

| Platform | Git auto-deploy | Free tier (bandwidth) | Paid entry | Bandwidth overage | Brazil POP | Commercial OK on free? | Lock-in | Best for |
|---|---|---|---|---|---|---|---|---|
| **Cloudflare Pages/Workers** | Native | **Unlimited, free** | $5/mo (Workers) | **None (no egress)** | **GRU + GIG + many** | Yes | Low | **This project** |
| Vercel | Native | 100 GB then pause | $20/seat/mo | $0.15/GB (Pro) | GRU1 | **No (Hobby)** | Med | Next.js apps |
| Netlify | Native | ~300 credits (~100 GB) hard cap | $9–20/mo | **~$0.55/GB** | No dedicated | Yes | Low | Form/identity ecosystem |
| GitHub Pages | Push/Actions | **100 GB soft** | n/a (free) | Soft-throttle | Fastly CDN | **No (no commerce)** | None | Pure free blog |
| Render | Native | 100 GB, sleeps | $7/mo warm | metered | No | Yes | Low | Dynamic backend |
| Fly.io | CLI/Docker | **None (CC req'd)** | ~$2+/mo | $0.02/GB+ | GRU | Yes | Med | Global backend |
| Cloudflare R2 | (storage) | 10 GB, **0 egress** | $0.015/GB-mo | **None** | edge | Yes | Low | Big downloads/galleries |
| Backblaze B2 | (storage) | 10 GB, 3× egress free | $6/TB-mo | $0.01/GB (free via CF) | via CDN | Yes | Low | Archival/large files |

## Shortlist of top candidates

1. **Cloudflare Pages → Workers Static Assets (winner).** Unlimited free bandwidth, best Brazil/LATAM edge, native git deploy + PR previews, free DNS + TLS, $5/mo path to a dynamic backend, near-zero lock-in. Meets every firm constraint at ~$0.
2. **GitHub Pages (free runner-up / fallback).** Maximally git-native and free; but the **no-commerce restriction** and **100 GB cap** disqualify it as the eventual course-selling hub. Good as a zero-dependency static fallback for the non-commercial portions.
3. **Vercel (only if you go heavy Next.js SSR).** Best DX, but egress-billed and non-commercial-blocked on free; front it with Cloudflare to cap bandwidth. Choose only if developer experience outweighs cost.
4. **Cloudflare R2 (not a host but an essential companion)** for the image galleries and downloadable materials — the specific piece that removes all surprise-egress risk.

## Key risks / trade-offs
- **Cloudflare Pages→Workers transition** (feature-freeze on Pages vs. investment in Workers): low risk because Pages is explicitly not being shut down and will auto-migrate, but choosing Workers Static Assets now is the future-proof path.
- **Vercel/Netlify egress billing**: the single biggest financial risk for a media-heavy site; avoided by Cloudflare.
- **Email deliverability**: free forwarding + Gmail send-as can be flagged by strict providers; Zoho free or a paid mailbox with proper DKIM solves it.
- **MoR fees** scale with revenue; revisit Stripe + tax tooling past ~$2–3k/mo in sales.

## Recommendations (staged)

**Stage 0 — Now (US$0/mo ≈ R$0):**
1. Build the site in **Astro** (or Hugo) with locale-prefixed i18n and `hreflang`; keep the **GitHub repo as source of truth**.
2. Host on **Cloudflare** — start a **Cloudflare Pages** project (or Workers Static Assets if you want the actively-developed path) connected to the repo. Push → auto-build → deploy; PR previews free.
3. **Delegate `rsicarelli.com` nameservers to Cloudflare.** Apex via auto-created flattened CNAME, www via CNAME to `*.pages.dev`, free Universal SSL.
4. **Cloudflare Email Routing** for `hello@rsicarelli.com` → personal inbox; configure SPF/DKIM/DMARC.

**Stage 1 — Polish & galleries (still ~US$0):**
5. Put large photos/downloadable materials in **Cloudflare R2** (10 GB free, zero egress). This is the key move that **eliminates surprise-bill risk** for a media-heavy site.
6. For sending *as* the domain, add **Zoho Mail free** (or Gmail send-as). Add `llms.txt` + strong on-page SEO; allow AI crawlers in `robots.txt`.

**Stage 2 — Sell courses (pay only fees):**
7. Add **Polar** (4% + $0.40) or **Lemon Squeezy** (5% + $0.50) MoR checkout links — no backend, global tax handled.
8. If you need custom gating/accounts, add **Cloudflare Workers ($5/mo ≈ R$25) + D1 + R2**.

**Thresholds that would change the plan:**
- Outgrow Cloudflare's 500 builds/mo → upgrade Pages plan or move builds to GitHub Actions (effectively unlimited).
- Adopt heavy SSR/Next.js and value Vercel's DX over cost → reconsider Vercel Pro, fronted by Cloudflare CDN to cap egress.
- Course sales exceed ~$2–3k/mo → re-evaluate MoR fees vs. self-managed Stripe + tax tooling.

## Decision framework (which choice fits which priority)
- **Lowest cost + no surprise bills + Brazil latency** → Cloudflare Pages/Workers + R2 + Cloudflare DNS/Email. *(This is the recommended default and fits all stated priorities.)*
- **Absolute simplicity, willing to accept commercial/bandwidth limits** → GitHub Pages for the non-commercial parts.
- **Heavy server-side rendering / Next.js DX is paramount, budget flexible** → Vercel Pro fronted by Cloudflare.
- **Need a real dynamic backend now** → Cloudflare Workers + D1/KV/R2 (native) or Render/Fly.io (containers).
- **Want a premium mailbox** → Fastmail; **multiple domains cheaply** → Migadu; **free starter mailbox** → Zoho.

## Caveats
- **Cloudflare Pages→Workers transition:** Pages is in feature-freeze ("maintenance") while Workers gets new investment; Pages is *not* being shut down and will auto-migrate later. Choosing Workers Static Assets now future-proofs you but is slightly less turnkey than Pages today.
- **Netlify/Vercel pricing is in flux:** Netlify moved to credits (Sept 2025, revised April 2026) and Vercel to credit-based Pro (Sept 2025). Verify current numbers at signup; some figures here come from secondary trackers, not primary pages, and may drift.
- **`llms.txt` is unproven:** Treat it as cheap insurance, not a ranking lever; no major AI lab has confirmed using it.
- **Zoho free tier limits:** no IMAP/POP, no forwarding, single domain, 5 GB — fine to start, but you'll pay ($1+/mo) to use a desktop client.
- **Exact .com registrar price** (~$10.44) is from third-party 2026 reviews; Cloudflare states only the at-cost/no-markup policy. Verify at checkout.
- **BRL conversions** use R$5.04 (June 1, 2026); the real is volatile — recheck before budgeting.
- **Cloudflare DNS record cap** dropped to 1,000 records for zones created after Sept 2024 — irrelevant at personal scale.