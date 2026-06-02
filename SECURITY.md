# Security Policy

This repository is the source of truth for [rsicarelli.com](https://rsicarelli.com) — a static site
built with Astro and deployed to Cloudflare Pages. Pushing to `main` auto-deploys production.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

- Preferred: open a private report via GitHub →
  [**Report a vulnerability**](https://github.com/rsicarelli/personal-site/security/advisories/new)
  (GitHub Security Advisories).
- Or email **rodrigo.sicarelli@gmail.com** with the details and reproduction steps.

You'll get an acknowledgement as soon as possible. There's no bounty program — this is a personal
site — but credit is happily given for responsibly disclosed issues.

## Supported scope

Only the live site and the current `main` branch are in scope. There are no released/versioned
artifacts to support.

## Secret hygiene

- **No secrets in the repo.** `.gitignore` ignores `.env` and `.env.*`; only `.env.example`
  (documenting `PUBLIC_*` client-safe values, no real secrets) is tracked.
- **Typed env.** Runtime configuration is validated by the `astro:env` schema in `astro.config.mjs`.
  `PUBLIC_*` values are client-exposed by design; server-only secrets are declared as server/secret
  fields and supplied via the Cloudflare Pages project environment, never committed.
- **GitHub controls (enabled):** secret scanning, push protection, Dependabot alerts + security
  updates, and automated security fixes. `main` is branch-protected (required `CI Summary`, linear
  history, no force-push).

## Dependencies & supply chain

- **Dependabot** (`.github/dependabot.yml`) proposes weekly grouped updates for npm (pnpm) and GitHub
  Actions, with a cooldown so releases age before adoption.
- **Dependency review** (`.github/workflows/dependency-review.yml`) gates pull requests that add a
  dependency with a known high-severity advisory or a disallowed (copyleft/network) license.
- **CodeQL** (`.github/workflows/codeql.yml`) statically analyses JavaScript/TypeScript on pushes,
  pull requests, and a weekly schedule.

## Response headers

Security headers are served from `public/_headers` (Cloudflare Pages): a strict Content-Security-
Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a locked-down
`Permissions-Policy`. See that file for the authoritative, commented policy.

## Third-party & SRI review

_To be completed in #82 (Minimal third-party / SRI review)._
