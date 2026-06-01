# personal-site

Source for **[rsicarelli.com](https://rsicarelli.com)** — my bilingual (pt-BR / English) personal
hub: blog, CV, portfolio, contact, upcoming events, photos from talks, downloadable materials, and
(later) exclusive paid content.

> **Status:** 🚧 Bootstrapping. The research foundation is complete; the app scaffold is the next step.

## What this is

A fully bilingual personal website where **the GitHub repo is the source of truth** — pushing
content auto-deploys the live site. Performance, Google SEO, and AI/LLM discoverability (GEO) are
first-class goals, built on free / open-source tooling.

## Decided stack (at a glance)

| Layer | Choice |
|-------|--------|
| Framework | **Astro** (SSG + islands, zero-JS by default) |
| Hosting | **Cloudflare Pages** (git push → auto-deploy) |
| DNS / media | **Cloudflare** DNS + **R2** for photos & downloads |
| Styling | **Tailwind CSS v4** + shadcn/ui |
| i18n | Subdirectory URLs `/en/` + `/pt-br/`, browser-locale default |
| Analytics | **Umami** + Cloudflare Web Analytics (cookieless, no banner) |

Full rationale, alternatives, and costs live in [`research/SUMMARY.md`](research/SUMMARY.md).

## Repository layout

```
research/   # Deep-research foundation (8 reports + consolidated SUMMARY.md)
            # → app code (Astro) lands here next
```

## Foundation docs

- [`research/SUMMARY.md`](research/SUMMARY.md) — consolidated digest + the unified recommended stack.
- [`research/README.md`](research/README.md) — index of the 8 research prompts and their results.
