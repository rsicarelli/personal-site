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

| Layer       | Choice                                                       |
| ----------- | ------------------------------------------------------------ |
| Framework   | **Astro** (SSG + islands, zero-JS by default)                |
| Hosting     | **Cloudflare Pages** (git push → auto-deploy)                |
| DNS / media | **Cloudflare** DNS + **R2** for photos & downloads           |
| Styling     | **Tailwind CSS v4** + shadcn/ui                              |
| i18n        | Subdirectory URLs `/en/` + `/pt-br/`, browser-locale default |
| Analytics   | **Umami** + Cloudflare Web Analytics (cookieless, no banner) |

Full rationale, alternatives, and costs live in the private research repo
[**rsicarelli/personal-site-private**](https://github.com/rsicarelli/personal-site-private) (`SUMMARY.md`).

## Repository layout

```
src/
  pages/            # Routes (Astro)
  layouts/          # BaseLayout shell
  components/       # Header, Footer + ui/ (shadcn/ui)
  content/          # Content collections — blog, portfolio, events, pages, cv
  config/           # site.ts — site constants, locales, nav
  styles/           # global.css — Tailwind v4 + Oklch design tokens
content.config.ts   # Collection schemas (Zod)  ·  astro.config.mjs  ·  Taskfile.yml
```

## Local development

Toolchain is pinned with [mise](https://mise.jdx.dev) (`mise.toml`: Node, pnpm, go-task).

```
mise install      # provision Node + pnpm + task
task install      # install dependencies
task dev          # start the dev server
task dod          # format + typecheck + lint + build (run before committing)
```

`task --list` shows everything. Hooks: `task hooks:install` enables the pre-commit DOD gate.

## Foundation docs

The research foundation lives in the private repo
[**rsicarelli/personal-site-private**](https://github.com/rsicarelli/personal-site-private):

- [`SUMMARY.md`](https://github.com/rsicarelli/personal-site-private/blob/main/SUMMARY.md) — consolidated digest + the unified recommended stack.
- [`RESEARCH-INDEX.md`](https://github.com/rsicarelli/personal-site-private/blob/main/RESEARCH-INDEX.md) — index of the 8 research prompts and their results.
