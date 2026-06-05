# SEO submission runbook (#54)

How to get `rsicarelli.com` indexed by Google **and** Bing and to push instant re-crawls via
IndexNow. The sitemap itself is already emitted (locale-aware, via `@astrojs/sitemap`) at
`/sitemap-index.xml`, and `robots.txt` advertises it — so this is about **submission**, not
generation.

> ✅ **The origin is LIVE** (`https://rsicarelli.com`, Hosting #60). IndexNow is **automated** (the
> `IndexNow` GitHub Action pings on every content push). The steps below that still need **your
> Google / Microsoft accounts** (GSC + Bing verification/submission) are **owner-only** — run them
> once, from the live site.

## 1. Google Search Console (owner-only, one-time)

1. Open <https://search.google.com/search-console>, **Add property → Domain → `rsicarelli.com`**.
   Google shows a **TXT** value like `google-site-verification=XXXXXXXX`.
2. In **Cloudflare → DNS → Records → Add record**: Type **TXT**, Name **`@`** (apex), Content the
   full `google-site-verification=…` string, TTL Auto. Save, then click **Verify** in GSC.
   - ⚠️ Do **not** edit or remove the existing `_maven-central-verification.fakt` TXT record.
3. **Sitemaps → add `sitemap-index.xml` → Submit.** (`robots.txt` already advertises it.)
4. Spot-check **URL Inspection** on a mirrored post — after the dev.to write-back (§4) it should
   report **our** URL as the Google-selected canonical, not the dev.to one.

## 2. Bing Webmaster Tools (owner-only, one-time)

Bing matters for GEO: **ChatGPT search uses Bing's index.**

1. Open <https://www.bing.com/webmasters> → **Import from Google Search Console** (one click, reuses
   the GSC verification) — or add the site and verify with the Bing TXT/meta.
2. **Sitemaps → submit `https://rsicarelli.com/sitemap-index.xml`.**
3. IndexNow shows up automatically once Bing sees pings from the key below — nothing to enable.

## 3. IndexNow — automated

The `.github/workflows/indexnow.yml` workflow pings IndexNow on every push to `main` that changes
content (and can be re-run via **Actions → IndexNow → Run workflow**). No account or secret needed —
the served `public/<key>.txt` verifies ownership (filename stem **is** the key; the body must equal
it, enforced by a CI test; rotate by adding a new `public/<newkey>.txt` and deleting the old one).

Manual one-off (rarely needed):

```bash
mise exec -- task build                                            # dist/ + the sitemap
node scripts/indexnow-submit.mjs --dry-run                          # inspect the payload (no network)
SITE_URL=https://rsicarelli.com node scripts/indexnow-submit.mjs    # POST to api.indexnow.org (200/202 = ok)
```

## 4. Canonical write-back to dev.to (#151) — _done; re-run after each ingest_

> ✅ Verified 2026-06-05: all 49 dev.to articles already point `canonical_url` at their
> `rsicarelli.com` counterparts (`--apply` reported 0 updated, 49 already correct).

49 blog posts are mirrored from dev.to. Each is **self-canonical** to `rsicarelli.com`, but the
dev.to originals (DA ~90) will win as canonical unless **they** point back to us. `scripts/devto-canonical-writeback.mjs`
sets each dev.to article's `canonical_url` to its matching `rsicarelli.com` URL (same `/<locale>/blog/<slug>`
form as our `<link rel="canonical">`), consolidating authority here — dev.to becomes the syndicated copy.

```bash
mise exec -- task devto:canonical                 # dry-run: print the 49 mappings (no network)
SITE_URL=https://rsicarelli.com DEV_TO_API_KEY=xxxx \
  node scripts/devto-canonical-writeback.mjs --apply   # write to dev.to (idempotent)
```

- `DEV_TO_API_KEY` is a **shell-only secret** (a dev.to "DEV Community API Key" from your dev.to
  settings) — **never** committed and **not** an `astro:env` field. The script never logs it.
- `--apply` GETs each article and only PUTs when the `canonical_url` differs, so it's safe to re-run.
- **After each future `pnpm ingest:devto`**, re-run `--apply` so newly imported posts get their
  canonical write-back. When you translate a placeholder (#143), **drop the `provenance`/`devtoId`
  from the translated file** — the translation is not a dev.to article; the original keeps the id.
- Verify in Search Console (URL Inspection) that our URLs — not the dev.to ones — are chosen as
  canonical. Related: #143, #144.

## 5. One-time + recurring

- **Once (owner):** verify GSC + Bing (§1–2), submit the sitemap to both, and run the dev.to
  canonical write-back (§4).
- **Each deploy:** sitemaps refresh automatically; the `IndexNow` Action pings Bing/IndexNow so
  changed pages re-crawl fast — no manual step.
- **Weekly (automated):** the `Production CWV monitoring` Action runs Lighthouse against the live
  origin and flags any Core Web Vitals regression.
- **Monthly (free):** spot-check 20–30 target queries in Google, Bing, ChatGPT, Perplexity to track
  AI/search visibility — paid trackers only become worth it once paid content launches.
