# Deep Research Prompts — rsicarelli.com

This folder is the **research foundation** for building [rsicarelli.com](https://rsicarelli.com):
a bilingual (pt-BR + English) personal hub — blog, CV, portfolio, contact, upcoming events,
talk photos, downloadable materials, and (later) paid content.

These are **unbiased, full-landscape research prompts**. Run them through a deep-research tool
(ChatGPT Deep Research, Claude, Gemini, Perplexity, etc.), then absorb the findings to make
build decisions. The prompts deliberately ask for the *full range* of options with trade-offs and
real costs — not a single opinionated answer.

## Firm constraints (baked into every prompt)

1. Fully **bilingual** (pt-BR + English), defaulting to the visitor's browser locale.
2. **GitHub repo = source of truth** → push = **auto-deploy** ("git as CMS"), no manual deploy.
3. Domain `rsicarelli.com` already owned (DNS wiring only).
4. First-class **performance**, **Google SEO**, and **AI/LLM discoverability** (GEO/AEO).
5. **Free / open-source first** where viable; real costs stated otherwise.

## How to use

For each themed prompt, paste the contents of **`00-shared-context.md`** at the top, then the
prompt body below it, into a fresh deep-research session. Save each report back here next to its
prompt (e.g. `02-technology-architecture.result.md`) so the findings live with the questions.

## Files & recommended run order

| # | File | Topic |
|---|------|-------|
| 00 | `00-shared-context.md` | Reusable context block — paste atop every prompt |
| 01 | `01-master-orchestration.md` | **Run first.** Integrated reference stacks + decision matrix |
| 02 | `02-technology-architecture.md` | Frameworks / SSGs / rendering / i18n implementation |
| 03 | `03-hosting-deploy-dns-cost.md` | Hosting, auto-deploy pipelines, DNS, email, cost |
| 04 | `04-content-architecture-repo.md` | Repo layout as git-CMS, content modeling, media strategy |
| 05 | `05-design-ui-ux-identity.md` | Visual identity, UI/UX, IA, design system, accessibility |
| 06 | `06-seo-and-geo-ai.md` | Google SEO + GEO/AEO (discoverable & citable by AI) |
| 07 | `07-analytics-metrics.md` | Privacy-first, free/OSS analytics |
| 08 | `08-payments-monetization.md` | Future-proof path to selling paid content (Brazil-aware) |

**Suggested flow:** run **01** for the big picture, then **02 → 08** as deep dives, then revisit
**01** to reconcile everything into a final stack decision. Internationalization is covered inside
02, 04, and 06 (it spans tech, content, and SEO), so there is no separate i18n prompt.
