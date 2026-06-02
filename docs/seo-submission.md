# SEO submission runbook (#54)

How to get `rsicarelli.com` indexed by Google **and** Bing and to push instant re-crawls via
IndexNow. The sitemap itself is already emitted (locale-aware, via `@astrojs/sitemap`) at
`/sitemap-index.xml`, and `robots.txt` advertises it — so this is about **submission**, not
generation.

> ⚠️ **Most steps need a LIVE origin and are deferred to the Hosting epic (#60).** They're listed
> here so they're ready the moment the site is deployed. What ships in-repo today: the IndexNow
> verification key file (`public/<key>.txt`), the `scripts/indexnow-submit.mjs` helper, and this
> runbook.

## 1. Google Search Console — _after deploy (#60)_

1. Add the property at <https://search.google.com/search-console> (Domain property → DNS TXT, or
   URL-prefix → verify via the Cloudflare-served site).
2. Submit the sitemap: **Sitemaps → enter `sitemap-index.xml` → Submit.**
3. Confirm `https://rsicarelli.com/robots.txt` resolves and lists the `Sitemap:` line (it does).

## 2. Bing Webmaster Tools — _after deploy (#60)_

Bing matters for GEO: **ChatGPT search uses Bing's index.**

1. Add the site at <https://www.bing.com/webmasters> (you can import from Search Console).
2. Submit `https://rsicarelli.com/sitemap-index.xml`.
3. IndexNow is enabled in Bing Webmaster Tools by default once the key is verified (next section).

## 3. IndexNow — key ships now, ping after deploy (#60)

IndexNow lets us notify Bing/Yandex/etc. of changed URLs instantly instead of waiting for a crawl.

- **Verification key (in-repo):** `public/<key>.txt` — a single line containing the key, served at
  `https://rsicarelli.com/<key>.txt`. The filename stem **is** the key; the file body must equal it
  (a CI test enforces this). To rotate, drop in a new `public/<newkey>.txt` and delete the old one.
- **Submit after each deploy** (needs the live origin):

  ```bash
  mise exec -- task build                       # produce dist/ + the sitemap
  node scripts/indexnow-submit.mjs --dry-run     # inspect the payload (no network)
  SITE_URL=https://rsicarelli.com node scripts/indexnow-submit.mjs   # POST to IndexNow
  ```

  The script reads every `<loc>` from `dist/sitemap-0.xml` and POSTs `{host, key, keyLocation,
urlList}` to `https://api.indexnow.org/indexnow` (200/202 = accepted). It's safe to re-run.

- **Automate later (#60):** once Cloudflare Pages auto-deploys, wire `scripts/indexnow-submit.mjs`
  into a post-deploy hook / GitHub Action so every push that changes content pings IndexNow.

## 4. Canonical write-back to dev.to (#151) — _run after deploy (#60)_

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

- **Once:** verify GSC + Bing, submit the sitemap to both.
- **Each deploy:** sitemaps refresh automatically; run the IndexNow ping (or let the #60 automation
  do it) so Bing/ChatGPT re-crawl changed pages fast.
- **Monthly (free):** spot-check 20–30 target queries in Google, Bing, ChatGPT, Perplexity to track
  AI/search visibility — paid trackers only become worth it once paid content launches.
