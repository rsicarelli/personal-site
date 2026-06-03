# Security Policy

This repository is the source of truth for [rsicarelli.com](https://rsicarelli.com) — a static site
built with Astro and deployed to Cloudflare Pages. Pushing to `main` auto-deploys production.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

- Preferred: open a private report via GitHub →
  [**Report a vulnerability**](https://github.com/rsicarelli/personal-site/security/advisories/new)
  (GitHub Security Advisories).
- Or email **hello@rsicarelli.com** with the details and reproduction steps.

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

The site is near-zero third-party by design (Astro SSG + islands, self-hosted fonts, media on R2).
A full audit of every externally-loaded subresource (#82):

- **Scripts:** the only third-party script is the **Umami** analytics tracker
  (`src/components/Analytics.astro`), loaded from `cloud.umami.is` and emitted **only** when the
  `PUBLIC_UMAMI_*` env vars are set. **No Subresource Integrity (`integrity=`) is applied:** a hosted
  analytics `script.js` is updated in place by the vendor, so a pinned hash would eventually fail to
  match and silently break the page (the script would be refused). Instead the script is constrained
  by CSP — `script-src` pins it to `https://cloud.umami.is` (and `connect-src` likewise for beacons),
  so it can only be loaded from that origin. The small inline tracker that calls it is allow-listed by
  sha256 hash (guarded by `tests/security/csp-hashes.test.ts`). If SRI is ever wanted here, self-host
  a pinned Umami build under `/_astro` and add its integrity hash.
- **Styles / fonts:** none third-party. Tailwind CSS is compiled into self-hosted, content-hashed
  `/_astro/*.css`; Inter + JetBrains Mono are downloaded at build by Astro's Fonts API and served from
  `/_astro/fonts/`. No external stylesheet or font-CDN `<link>` exists, so there is nothing to pin.
- **Frames:** the `LiteYouTube` facade injects an `https://www.youtube-nocookie.com` iframe only on
  user click (`frame-src`). SRI does not apply to frames/documents; the origin is pinned by CSP and
  the privacy-preserving `-nocookie` host is used.
- **Images:** all first-party (`/_astro` optimized, or R2 via `media.rsicarelli.com`). A few legacy
  blog posts hot-link external images; these are tracked for migration to R2 (#170).

**Conclusion:** SRI is not applicable to the one third-party resource (a rotating hosted script);
CSP origin-pinning + the inline-script hash guard are the appropriate controls. Re-run the audit
(`<script src>`, `<link>`, `<iframe>`, external `<img>`) whenever a new embed is introduced.
