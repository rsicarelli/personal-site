# Git-as-CMS Patterns for a Bilingual Personal Website (2025–2026): A Landscape Report for rsicarelli.com

**Scope:** Repo/folder conventions, bilingual (pt-BR + EN) content organization, content modeling for SEO/AI, the full git-based CMS landscape, media/asset strategy, and versioning/draft/preview workflows — surveyed without anchoring on a single layout or tool. USD→BRL conversion uses **R$5.30 per US$1** (mid-2026 approximate; stated explicitly because BRL has traded in a volatile 5.0–5.5 band).

## TL;DR
- **A locale-aware layout (`/content/{collection}/{locale}/…` or per-file `post.pt.md` / `post.en.md`) inside an Astro 5 Content-Layer repo, deployed push-to-deploy on Cloudflare Pages, with an optional git-based editor (Keystatic or Sveltia CMS) layered on top, is the best-fit stack** for a single highly technical owner who wants the GitHub repo as source of truth, free tooling, strong SEO, and bilingual completeness. Type-safe Zod schemas double as the source for JSON-LD structured data.
- **Keep both locales complete and discoverable** by (a) making locale part of a type-safe schema so a missing translation is a build error or visible fallback, (b) emitting `hreflang` alternate tags + a per-locale sitemap, and (c) defaulting to the visitor's browser locale via edge/middleware redirect while still serving crawlable, language-prefixed URLs (`/pt-br/…`, `/en/…`).
- **In-repo assets are fine until roughly 1 GB repo size (GitHub's recommended ceiling; 5 GB strongly recommended max)**; talk-photo galleries and large downloadables should go to **Cloudflare R2 (zero egress, 10 GB free, then $0.015/GB ≈ R$0.08/GB)** behind a CDN, not Git LFS (whose free tier is small and bandwidth-metered). Sell paid content later via a Merchant-of-Record (Lemon Squeezy, Polar, or Gumroad) rather than building billing into the static site.

## Key Findings

1. **Astro is the strongest single fit** for this exact brief in 2025–2026: its Content Layer API (Astro 5.0, Dec 2024) gives type-safe Zod-validated collections that scale to tens of thousands of entries, built-in i18n routing with browser-locale detection, first-class SEO/sitemap integrations, and it is the framework most git-based CMSes (Keystatic, Sveltia, Decap, Pages CMS, TinaCMS) support. It is not the only valid choice — Hugo, Eleventy, Next.js, Nuxt Content, and SvelteKit are all viable — but it minimizes glue code for a polyglot engineer.
2. **The git-based CMS layer is optional and decoupled from the SSG.** For a single technical owner, editing MDX/Markdown directly in an IDE (optionally with the free Front Matter VS Code extension) is the zero-lock-in baseline. If a GUI is wanted, **Keystatic** (TypeScript schema, same-repo, free) and **Sveltia CMS** (best-in-class i18n, free, but still 0.x beta) are the leading free choices; **Decap** is the battle-tested but slowing incumbent; **TinaCMS** offers visual editing but adds a SaaS dependency and lacks native i18n; **Pages CMS** is a compelling no-build hosted option.
3. **Bilingual completeness is a process problem, not just a file problem.** Every major SSG supports either parallel files (`post.pt.md`/`post.en.md`) or locale folders (`/pt/`, `/en/`). The differentiator is whether the framework/CMS *forces* or *surfaces* missing translations. Astro + Zod, Hugo's `EnableMissingTranslationPlaceholders`, and Sveltia's locale-aware validation are the strongest guardrails.
4. **Structured data is now an AI-discoverability lever, not just a Google rich-results feature.** Model the CV as `Person` + credential/job types, portfolio items as `CreativeWork`/`SoftwareSourceCode`, events as `Event`, courses as `Course`. Emit JSON-LD from the same Zod-typed content. Add an `llms.txt` file as cheap future-proofing (no major LLM officially consumes it yet).
5. **Selling paid courses later should be bolted on via a Merchant-of-Record**, keeping the static site free of a backend. Lemon Squeezy (5% + $0.50, Stripe-owned), Polar, and Gumroad (10% + $0.50) all handle global tax/VAT.

## Details

### 1. Repo / folder conventions for content collections

The dominant 2025–2026 pattern across SSGs is a top-level `content/` (or `src/content/`) directory split by collection, with per-entry **page bundles** (a folder per entry holding `index.md` + co-located images) once entries carry their own assets.

- **Astro (Content Layer API, Astro 5.0+, Dec 2024):** Collections live in `src/content/<collection>/` and are declared in `src/content.config.ts` using the `glob()` loader (files) or `file()` loader (single data file), each with a Zod `schema`. The Content Layer was explicitly built to scale beyond the old API; per Astro's own engineering blog, "while many people were building sites with thousands of pages, our Content Collections API struggled to scale into the tens of thousands of pages, with slower builds and excessive memory usage." Loaders can also pull remote data (CMS, GitHub, Bluesky). This is the most type-safe, IDE-friendly option for a TypeScript engineer. Live Collections (Astro 5.10, June 2025) add runtime fetching — useful later for a live course catalog or e-commerce inventory.
- **Next.js (App Router):** Content via `@next/mdx`, `next-mdx-remote`, or a content SDK. **Contentlayer is effectively abandoned** (the maintainer wrote he can "currently allocate one day a month to the project"; Stackbit sponsorship scaled down after Netlify acquisition; incompatible with App Router). The recommended successors are **Velite** (Zod-based, framework-agnostic) and **Content Collections** (`@content-collections/core`, a Contentlayer-inspired drop-in by Sebastian Sdorra). Typical layout: `content/<collection>/*.mdx` + a `velite.config.ts` / `content-collections.ts`.
- **Hugo:** `content/` with either **page bundles** (`content/posts/my-post/index.md` + assets) or flat files; multilingual via filename suffix (`post.en.md`/`post.pt.md`) or per-language `contentDir`. Fastest builds at scale; Go templating is the trade-off.
- **Eleventy (11ty):** Maximally flexible; most users adopt a folder-per-locale (`/en/`, `/pt/`) using the Data Cascade with directory data files (`en/en.json` → `{"lang":"en"}`). Official i18n plugin provides `locale_url` and `locale_links` filters.
- **Nuxt Content v3:** `content/` directory; collections defined in `content.config.ts`; **v3 moved to SQL-based storage in production** to fix v2's serverless bundle-size problem. i18n pattern is one collection per locale (`content_en`, `content_pt`) with query-time fallback.
- **SvelteKit:** Typically `mdsvex` + a `content/` or routes-colocated layout; less batteries-included than Astro/Nuxt for collections.
- **Gatsby:** Still works (GraphQL content layer) but momentum has clearly shifted away from it; not recommended for a new build in 2026.

**Folder structure that scales to hundreds of posts/photos while keeping push-to-deploy simple:** a per-collection + per-locale + page-bundle hybrid, e.g.
```
src/content/
  blog/<slug>/{index.pt.mdx, index.en.mdx, cover.jpg}
  portfolio/<slug>/{index.pt.mdx, index.en.mdx}
  events/<slug>/{index.pt.mdx, index.en.mdx}
  cv/cv.pt.yaml, cv/cv.en.yaml          # structured data, not prose
  pages/{contact,about}/…
```
Photos that are *part of a post* co-locate in the bundle; *galleries* of talk photos go to external storage (see §5).

### 2. Bilingual content organization at the file level

Four patterns dominate; all are legitimate and supported by the major SSGs:

| Pattern | Example | Best when |
|---|---|---|
| **Parallel files, suffix** | `post.pt.md` / `post.en.md` (same folder) | Hugo, Astro; keeps translations visually adjacent |
| **Locale folders** | `/content/pt/post.md`, `/content/en/post.md` | Hugo `contentDir`, Eleventy, Nuxt (collection-per-locale) |
| **Locale-prefixed routes** | `/pt-br/blog/…`, `/en/blog/…` | Astro/Next.js i18n routing (URL layer, independent of file layout) |
| **Single-file multi-locale** | one entry with `{ title: {pt, en} }` fields | Small singletons (CV, contact); Keystatic's documented i18n workaround |

**Astro i18n routing** (built-in since v4.0): configure `locales: ["pt-br","en"]`, `defaultLocale`, and `routing.prefixDefaultLocale`. Astro can accept the visitor's browser-preferred language (`Astro.preferredLocale`) and supports per-locale `fallback`. For "default to browser locale," the common pattern is a middleware/edge redirect from `/` to `/<detected-locale>/` while keeping both `/pt-br/` and `/en/` as crawlable static routes (do **not** rely on cookie-only detection, which requires disabling prerendering and hurts SEO). **Paraglide JS 2.0** is a popular companion for UI-string translation with tree-shaking.

**Hugo multilingual mode** links translations by shared path+basename or an explicit `translationKey`; `EnableMissingTranslationPlaceholders` flags untranslated strings — a built-in completeness check. **Nuxt i18n** uses `@nuxtjs/i18n` with `strategy: 'prefix_except_default'` and per-locale collections.

**Keeping locales in sync (the hard requirement):**
- **Type-safe schema as a gate:** in Astro, make the per-locale entry required in the schema so a build fails (or a visible fallback renders) when a translation is missing.
- **Per-locale sitemaps + `hreflang`:** `@astrojs/sitemap` auto-generates per-language entries; emit `<link rel="alternate" hreflang="pt-br|en|x-default">` so Google and AI crawlers see both versions.
- **CI completeness check:** a simple GitHub Actions script (the owner's stack) that diffs the set of slugs per locale and fails the PR if a locale is missing — there is no universal off-the-shelf linter, so a custom check is standard practice.
- **Sveltia CMS** validates non-default-locale fields and duplicates all locales on entry duplication, directly addressing Decap's known bug where duplicating an i18n entry only copies the default locale.

### 3. Content modeling for SEO + AI discoverability

**Type-safe content tooling:** Astro Content Collections (Zod), Velite (Zod), Content Collections (Zod), Keystatic (TypeScript schema), and Decap/Sveltia/Pages CMS (YAML/JSON config) all let you define frontmatter shape. Zod-based options give the engineer compile-time types + runtime validation in one place — the recommended approach here.

**Structured data (JSON-LD, schema.org)** — model once, emit JSON-LD from the typed content:
- **CV/résumé:** `Person` (name, jobTitle, knowsAbout, sameAs → GitHub/LinkedIn), with work history. Consider the community **JSON Resume** schema (`jsonresume.org`) or **Schema Resume** (`schema-resume.org`) as the internal data model, then map to schema.org. `knowsAbout` can enumerate Kotlin/Swift/KMP/TS/Python/Rust as `ComputerLanguage`.
- **Portfolio projects:** `CreativeWork` or `SoftwareSourceCode` (codeRepository, programmingLanguage).
- **Events (talks):** `Event` with `startDate`, `location`, `performer` (Person), `offers`.
- **Courses (paid, later):** `Course` + `Offer` with `price`/`priceCurrency`.
- **Blog:** `Article`/`BlogPosting` with `headline`, `datePublished`, `author`, `inLanguage`.

**AI/LLM discoverability (ChatGPT, Claude, Perplexity, Gemini):** The evidence is nuanced and worth stating honestly. Controlled tests (Mark Williams-Cook) show ChatGPT and Perplexity currently treat JSON-LD "as text on a page" — they parse it as content rather than via a special structured-data pipeline, and even read *invalid* schema. So: (a) **clean, semantic HTML + visible text matters most**; (b) **valid JSON-LD still helps** — Microsoft confirms Bing/Copilot use schema.org, and pages with valid structured data appear measurably more often in AI summaries per 2025 Semrush/Measured benchmarks. **`llms.txt`** is a proposed Markdown "site map for LLMs"; Google's Gary Illyes stated at the 2025 Search Central event that "We currently have no plans to support LLMs.txt," and John Mueller posted "FWIW no AI system currently uses llms.txt." Treat it as cheap, optional future-proofing ("AI discoverability insurance"), not a ranking lever.

### 4. Git-based CMS landscape for a single technical owner (full survey)

**Baseline option — no CMS at all:** A polyglot engineer can edit MDX/YAML directly in their IDE and `git push`. This is zero-lock-in, zero-cost, and the source of truth is unambiguously the repo. The **Front Matter CMS** VS Code extension (free, open source, by Elio Struyf) adds a dashboard, SEO checks, media insertion, content scheduling and (since v10) i18n support — all running locally with no server. Best for: developers who never want to leave the editor. Con: not usable from a phone/browser, English-leaning UI.

For each hosted/web option below: what it is, who it's for, pros/cons, maturity, lock-in, i18n, media, cost (USD + ≈BRL @ R$5.30).

- **Decap CMS (formerly Netlify CMS)** — MIT, free. Battle-tested React SPA at `/admin`, config via `config.yml`, broadest Git backend support (GitHub, GitLab, Bitbucket, Gitea, Azure). *i18n:* yes (`single_file`/`multiple_files`/`multiple_folders`), though duplicating i18n entries has a known bug (only default locale copied). *Media:* in-repo library + Cloudinary/Uploadcare integrations; **no Git LFS support**. *Editorial workflow:* yes (`publish_mode: editorial_workflow` → draft/review/ready via PRs). *Maturity/momentum:* most established but **development slowed materially after Netlify handed it to the community/PM in 2023**; UI feels dated; YAML config gets unwieldy. *Lock-in:* none (content is plain files). *Cost:* $0. Best for: those wanting the proven, no-vendor-dependency default.
- **Sveltia CMS** — MIT, free. A ground-up Svelte rewrite and de-facto successor to Netlify/Decap, drop-in compatible with many Decap configs. *i18n:* **best in class** — built multilingual-first, all three structures, button-based locale switching, validates non-default locales, fixes Decap's duplication/CJK bugs; one-click machine translation (recently migrated from DeepL to Google Cloud Translation API). *Media:* dedicated Asset Library, stock-photo integration (Pexels/Pixabay/Unsplash), built-in WebP conversion + resizing; **S3/Cloudflare R2 support is not yet available** (planned). *Architecture:* tiny (<500 KB) client-side SPA from CDN, framework-agnostic; OAuth needs a small free Cloudflare Workers auth proxy. *Maturity:* **still 0.x beta (v0.145.0, Mar 2026); 1.0 targeted mid-2026** per docs; single maintainer (Kohei Yoshino / @kyoshino, ex-Mozilla localizer); ~2.2k GitHub stars; PRs not currently accepted; no editorial workflow or user management yet. *Lock-in:* none. *Cost:* $0 (no paid tier; maintainer-funded). Best for: this project's bilingual requirement specifically — but accept beta risk.
- **Keystatic** — MIT, free (by Thinkmill). TypeScript-defined schema, edits Markdown/MDX/YAML/JSON in the same repo; runs locally (file system) or in GitHub mode; first-class Astro/Next/Remix support. *i18n:* **no native i18n** — handled by repeating fields per locale or duplicating collections (documented community workaround); fine for 2 locales, awkward beyond. *Media:* image fields with optimization; Keystatic Cloud (optional) simplifies GitHub auth/images. *Maturity:* newer, smaller maintainer team but production-ready and growing; automated GitHub App setup. *Lock-in:* low (content stays in repo; Keystatic Cloud optional). *Cost:* $0 for core; Keystatic Cloud has its own tier. Best for: a TypeScript engineer who wants schema-as-code and tight Astro integration and can tolerate manual i18n.
- **TinaCMS** — open-source library + Tina Cloud SaaS. Unique **visual/click-to-edit** live editing; TypeScript schema generates a typed GraphQL client. *i18n:* **no native i18n support** (a real gap for this project). *Media:* via Tina Cloud or self-host. *Editorial Workflow:* from the Team Plus plan. *Maturity:* active, polished, React/Next-oriented (Astro support experimental). *Lock-in:* moderate — Tina Cloud is a SaaS dependency (auth, GraphQL, media); self-hosting requires running a database (Redis/Mongo) + auth. *Cost:* free tier = 2 users; **Team $29/mo (≈R$154); Team Plus $49/mo (≈R$260) adds Editorial Workflow; Business $299/mo (≈R$1,585)**; self-host = free software, you run the backend. Best for: teams needing visual editing — **overkill and i18n-deficient for this solo bilingual brief**.
- **Pages CMS** — MIT, free (by Ronan Berder). GitHub-native: no database/API, every change is a commit; hosted free at app.pagescms.org or self-host on Vercel. Config via a single `.pages.yml`. *i18n:* configurable content types (locale handled via your file convention). *Media:* drag-drop, folder organization, **connects to AWS S3 / Cloudflare R2**, supports Git LFS; **content scheduling** (one-off/recurring) and inline comments. *Maturity:* actively developed (rebuilt on Next.js 16/React 19/Tailwind 4; "Pro" features merged into free OSS). *Lock-in:* none. *Cost:* **$0 (100% free, hosted or self-hosted)**. Best for: wanting a hosted GUI with R2 media + scheduling and zero build/infra — a strong dark-horse pick here.
- **CloudCannon** — commercial, hosted. Visual editing, team workflows, analyzes repo to auto-generate inputs; excellent Jekyll/Hugo/Eleventy support. *Lock-in:* low on content, higher on workflow. *Cost:* paid tiers (team-oriented, higher than the free tools). Best for: agencies/marketing teams — more than a solo owner needs.
- **Static CMS** — a Decap fork with side-by-side i18n and better media; smaller community than Decap; momentum largely superseded by Sveltia. Free.
- **Spinal / Outstatic / others** — Spinal is a hosted Git-based CMS for onboarding non-technical authors (Jekyll/Eleventy/Astro); Outstatic is a Next.js-only in-repo CMS with zero backend. Both free/low-cost, niche.

### 5. Media / asset strategy

**GitHub hard limits and recommendations (primary source, GitHub Docs):**
- Files **>50 MiB** trigger a warning; **>100 MiB are blocked** from regular Git; browser uploads capped at 25 MiB.
- **Repository: "ideally less than 1 GB, and less than 5 GB is strongly recommended."** Large repos slow clone/fetch and CI.
- **Git LFS:** per-file limit 2 GB (Free) / up to 5 GB (higher plans). **Billing:** the November 15, 2024 model raised the included free Git LFS to **250 GiB storage + 250 GiB/month bandwidth** for some account types, but the long-standing widely-quoted default is **1 GB storage + 1 GB/month bandwidth free**, with paid **data packs of $5/mo per 50 GB storage + 50 GB bandwidth** (≈R$26.50). LFS bandwidth is consumed on every download/CI checkout and can exhaust quickly. **Git LFS cannot be used with GitHub Pages**, and Decap doesn't support LFS. For distributing large binaries, GitHub **Releases** are unmetered for total size.

**When in-repo assets become a problem:** when the `.git` directory approaches ~1 GB, when individual files near 100 MiB, when CI clone times balloon, or when you have hundreds of multi-MB talk photos. A photographer's 500 × 10 MB images = ~5 GB — already past GitHub's comfortable ceiling and into LFS-cost territory.

**External storage / image-service pricing (USD + ≈BRL @ R$5.30):**
- **Cloudflare R2** — $0.015/GB-mo storage (≈R$0.08), **zero egress fees, ever** (per Cloudflare's pricing docs: "Egressing directly from R2... does not incur data transfer (egress) charges and is free"); Class A (writes) $4.50/M, Class B (reads) $0.36/M. **Free tier: 10 GB-month storage + 1M Class A + 10M Class B per month.** S3-compatible. **Best balance for this use case** — talk galleries + downloadables served free of bandwidth charges. Pair with Cloudflare's CDN (and the site can live on Cloudflare Pages for a unified stack).
- **Cloudflare Images** — managed: $5 per 100k images stored/mo (≈R$26.50) + $1 per 100k delivered (≈R$5.30); **free plan = 5,000 unique transformations/mo**, no bandwidth fees. Good if you want automatic resizing/variants without DIY.
- **Bunny.net** — Storage $0.01/GB/region (no free tier) + Optimizer ~$9.50/mo flat (≈R$50) for unlimited image optimization; cheap CDN. Predictable flat pricing.
- **Cloudinary / imgix** — rich transformation APIs but 3–5× pricier at scale due to transformation credits + bandwidth; overkill for a personal site. Cloudinary has a free tier.
- **AWS S3 + CloudFront** — flexible but egress (~$0.09/GB) makes it the most expensive for media delivery; avoid unless already on AWS.
- **Backblaze B2** — $0.006/GB cheapest pure storage, free egress via Cloudflare CDN; better for archives/backups than hot image serving.

**Migration path (in-repo → external):** (1) move gallery/large-download files out of the repo into R2 (S3 API + `rclone`/`aws s3 sync`); (2) replace in-repo references with R2 public URLs (or a custom domain on the bucket) — keep the *reference* in frontmatter so the repo stays source-of-truth for metadata; (3) optionally use R2's **Sippy** to lazily migrate on-demand; (4) keep small, post-coupled images in the page bundle (they help build-time image optimization in Astro). Pages CMS and Decap (via S3) can target R2 today; Sveltia's R2 support is planned.

### 6. Versioning, drafts/scheduling, and review workflow

- **Push-to-deploy hosts with preview deployments (free tiers):**
  - **Cloudflare Pages** — unlimited bandwidth on all tiers, 500 builds/mo free, preview deployments per branch, 100 custom domains; cheapest at scale (Pro $5/mo ≈R$26.50). **Recommended host** for a static bilingual site, especially paired with R2.
  - **Netlify** — pioneered git-push-to-deploy; Deploy Previews per PR; free tier moved to a **credit system (300 credits/mo)** in Sept 2025, making cost prediction harder; Pro $19/mo (≈R$101).
  - **Vercel** — best Next.js DX, Preview Deployments per PR; **Hobby plan is free but non-commercial only** (selling courses later would require Pro $20/user/mo ≈R$106); usage-based overages can surprise.
- **Drafts & scheduled publishing:** the universal pattern is a frontmatter `draft: boolean` and/or a future `pubDate`, with **build-time filtering** (`getCollection('blog', ({data}) => !data.draft && data.pubDate <= new Date())`). Because static builds are point-in-time, "scheduled" posts need a **scheduled rebuild** — a GitHub Actions cron (the owner's stack) or Cloudflare cron trigger that rebuilds daily to publish future-dated content. Pages CMS has native content scheduling built in.
- **Editorial review:** for a solo owner, ordinary **branch + PR + preview deploy** is sufficient and ideal (review the rendered bilingual preview before merge to `main` → auto-deploy). Decap's `editorial_workflow` and TinaCMS's Editorial Workflow (Team Plus) replicate this in a GUI; Keystatic/Sveltia rely on the underlying Git PR flow.

### 7. Selling exclusive paid content (later phase)

Keep the static site static; delegate payments/entitlement to a **Merchant of Record (MoR)** that handles global VAT/tax (important for a Brazil-based seller selling internationally):
- **Lemon Squeezy** — 5% + $0.50/transaction with no monthly fee (+1.5% international, +1.5% PayPal, +0.5% subscriptions); MoR covering tax in 135+ countries; acquired by Stripe (July 2024) and being folded into Stripe. Strong for courses/subscriptions.
- **Polar** — developer-focused MoR (license keys + GitHub integration). Note its **2026 pricing restructure**: the free Starter plan is now **5% + $0.50** (matching Lemon Squeezy/Paddle); the older sub-4% economics now require a paid tier (Pro $20/mo, Growth $100/mo, Scale $400/mo). Newer/evolving.
- **Gumroad** — flat **10% + $0.50 per direct sale** with no volume discounts (30% on its Discover marketplace); simplest, MoR since Jan 2025, built-in discovery marketplace; most expensive at volume.
- **Payhip / Podia / Teachable** — course-specific builders if you want hosted course delivery rather than gated downloads.
- **Stripe direct** — 2.9% + $0.30 but **you** become responsible for tax compliance in every jurisdiction; only worth it if you'll handle VAT yourself.
For a few pre-recorded courses, embed an MoR checkout/overlay on a static product page; gate downloads behind the MoR's delivery/license system.

## Comparison Table — Git-based CMS options

| Tool | What it is | i18n | Media | Editorial workflow | Maturity/momentum | Lock-in | Cost (USD / ≈BRL @5.30) |
|---|---|---|---|---|---|---|---|
| **IDE + Front Matter (VS Code)** | Local editor extension | Yes (v10+) | Local + insert | Git PRs | Stable, active, free | None | $0 |
| **Keystatic** | TS-schema, same-repo | No native (workaround) | Image fields + Cloud | Git PRs | Production-ready, growing | Low | $0 core |
| **Sveltia CMS** | Decap rewrite (Svelte) | **Best-in-class** | Asset Library + stock; no R2 yet | Planned (not yet) | **0.x beta**, 1 maintainer | None | $0 |
| **Decap CMS** | Established React SPA | Yes (dup bug) | In-repo + Cloudinary; no LFS | Yes (`editorial_workflow`) | Mature but slowed | None | $0 |
| **Pages CMS** | GitHub-native hosted | Via convention | Drag-drop + **S3/R2 + LFS**; scheduling | Git PRs | Active, rebuilt 2025 | None | **$0 hosted/self-host** |
| **TinaCMS** | Visual click-to-edit | **None** | Tina Cloud/self-host | Team Plus ($49) | Active, React-first | Moderate (Tina Cloud) | Free 2 users; $29/$49/$299 mo (R$154/260/1,585) |
| **CloudCannon** | Commercial visual CMS | Yes | Built-in | Yes | Mature, team-focused | Low–moderate | Paid tiers |
| **Static CMS** | Decap fork, side-by-side i18n | Yes | Improved | Yes | Smaller community | None | $0 |

## Shortlist — top candidates with rationale

1. **Astro 5 (Content Layer + Zod) + edit-in-IDE (optionally Front Matter) + Cloudflare Pages + R2 — RECOMMENDED.** Best fit for a polyglot engineer: type-safe bilingual content, built-in i18n with browser-locale default, free SEO/sitemap, unlimited-bandwidth host, zero-egress media. No CMS lock-in; the repo is unambiguously the source of truth.
2. **Same stack + Keystatic** if a same-repo GUI with TypeScript schema is wanted and the 2-locale manual i18n is acceptable. Lowest-risk GUI choice (stable, no SaaS).
3. **Same stack + Sveltia CMS** if bilingual editing ergonomics are the top priority and 0.x-beta risk is acceptable; revisit at its 1.0 (targeted mid-2026).
4. **Pages CMS** as the hosted, zero-infra GUI alternative — uniquely combines R2 media + native scheduling + free hosted app, framework-agnostic so it survives an SSG change.

## Key risks / trade-offs
- **Sveltia beta risk:** breaking changes before 1.0; single maintainer; no R2 media yet; no editorial workflow yet. Mitigate by keeping content as plain files (so you can switch CMSes freely).
- **Keystatic i18n gap:** field-duplication for 2 locales is fine but scales poorly if you add a 3rd language.
- **Vercel commercial clause:** if you sell courses, the free Hobby plan no longer applies — budget Pro, or host on Cloudflare Pages (no such restriction).
- **Git LFS trap:** small free quota + bandwidth metering + no GitHub Pages support; don't use it for galleries — go straight to R2.
- **AI discoverability is partly speculative:** JSON-LD is currently consumed by LLMs as plain text and `llms.txt` is unsupported by major engines today; invest in semantic HTML + valid schema, treat `llms.txt` as optional insurance.
- **Scheduled publishing needs a cron rebuild** on a static host; a future-dated post won't appear until a build runs.

## Decision framework (which choice fits which priority)
- **Priority = zero lock-in + max control:** Astro + edit-in-IDE (+ Front Matter). Repo is the only source of truth.
- **Priority = best bilingual editing UX:** Astro + Sveltia CMS (accept beta) or revisit at 1.0.
- **Priority = TypeScript schema-as-code GUI, low risk:** Astro + Keystatic.
- **Priority = hosted GUI, no build/infra, R2 media + scheduling:** Pages CMS (framework-agnostic).
- **Priority = visual click-to-edit:** TinaCMS — but accept SaaS dependency and no i18n (not recommended here).
- **Priority = fastest builds at huge scale:** Hugo (trade DX for speed).
- **Host:** Cloudflare Pages (unlimited bandwidth, free previews) for a static bilingual site; pair with R2 for media. Netlify/Vercel only if you specifically want their DX features.
- **Paid content later:** Lemon Squeezy, Polar, or Gumroad (MoR) bolted onto the static site; don't build billing in-house.

## Caveats
- USD→BRL at **R$5.30/US$1** is an approximation within a volatile 5.0–5.5 band; verify at purchase time.
- CMS/host/payment pricing changes frequently — Netlify moved to credits (Sept 2025), GitHub changed LFS inclusions (Nov 2024), Sveltia's translation backend changed (DeepL→Google), and **Polar restructured its MoR pricing in 2026** (free tier now 5% + 50¢). Confirm against primary docs before committing.
- Sveltia's "1.0" date is inconsistent across its own sources (README "early 2026" vs docs "mid-2026"); treat as beta until released.
- The "structured data as text" LLM finding comes from independent SEO experiments (Williams-Cook) and vendor benchmarks plus Google statements (Illyes/Mueller) on `llms.txt`, not from official LLM-vendor documentation of their ranking pipelines; directionally reliable but not authoritative.