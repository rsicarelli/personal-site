# Analytics runbook (#70)

How `rsicarelli.com` measures traffic: **privacy-first, cookieless, no consent banner**. The
client-side layer (Umami + key events) ships in-repo, gated on env; the Cloudflare baseline and live
data flows are **owner-only** steps tied to Hosting (#60). See the public-facing note at
`/en/privacy` + `/pt-br/privacy` and the analytics research in the private repo
(`07-analytics-metrics.result.md`).

## Architecture

| Layer    | Tool                         | Status                              | Notes                                |
| -------- | ---------------------------- | ----------------------------------- | ------------------------------------ |
| Primary  | **Umami** (cookieless)       | wired (#71/#73), gated on env       | pageviews + custom events            |
| Baseline | **Cloudflare Web Analytics** | no-code toggle, **deferred to #60** | redundant, ad-blocker-resistant, RUM |

Both are cookieless and store no personal data, so **no consent banner** is required (LGPD Art. 12 /
ANPD legitimate interest Art. 7 IX; GDPR/PECR — no device storage → no consent). PostHog is **not**
part of this layer (future product analytics, tracked in #75 → Monetization #83).

## Umami (#71) — already shipped

- `src/components/Analytics.astro`, rendered once in `BaseLayout` `<head>`. It emits **nothing**
  unless **both** `PUBLIC_UMAMI_SRC` and `PUBLIC_UMAMI_WEBSITE_ID` are set, so dev/local and CI ship
  **zero analytics JS**.
- Loaded `defer` + `data-auto-track="false"`; page views are counted manually on `astro:page-load`
  (initial load + every View Transition swap), so exactly one pageview per navigation.
- The neutral `/` gateway is intentionally not instrumented (it `location.replace()`s to a locale
  before any deferred script runs).

### Key events (#73) — locale-agnostic labels

| Event               | Where                            | Mechanism                                                                                 |
| ------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `material-download` | Materials download links         | declarative `data-umami-event` + `data-umami-event-file`                                  |
| `outbound-link`     | any cross-origin `<a>` site-wide | one capture-phase listener in `Analytics.astro` (skips `[data-umami-event]`/`[download]`) |
| `video-play`        | `LiteYouTube.activate()`         | guarded `window.umami?.track(...)` (no-op without Umami)                                  |

## Provisioning Umami (owner-only, with #60)

1. Create the site in **Umami Cloud** (free tier — 100k events/mo, 6-month retention) or a
   self-hosted instance. Copy the **tracker script URL** and the **website ID**.
2. In the **Cloudflare Pages** project → **Settings → Environment variables**, set
   `PUBLIC_UMAMI_SRC` (the script URL) and `PUBLIC_UMAMI_WEBSITE_ID` (the ID) for Production (and
   Preview if desired). Leave them blank locally — `.env.example` keeps them stubbed.
3. Redeploy; confirm the deferred `<script>` appears in the live HTML and the Umami dashboard shows
   pageviews + the three events firing once each (downloads, outbound, video).

## Cloudflare Web Analytics (#72) — deferred to Hosting (#60)

Cloudflare Web Analytics is cookieless, free, and **needs no app code**: it is enabled by **automatic
beacon injection**, a dashboard toggle on the deployed site. So there is nothing to build in-repo —
only an owner-only step once the site is live on Cloudflare Pages (#60):

1. **Cloudflare dashboard → Web Analytics → Add a site** → `rsicarelli.com`.
2. Enable **automatic setup** (Cloudflare injects the beacon at the edge — no token in the repo, no
   second script to maintain). It uses no cookies, no client-side storage, and no fingerprinting.
3. Verify the beacon loads on the live site and the dashboard reports page views + Core Web Vitals.

This is the **redundant baseline** to Umami (ad-blocker-resistant edge measurement), not a
replacement.

## Real-user Core Web Vitals (RUM / INP) — deferred to #146 / #60

The SEO go-live (#146) flags a possible `web-vitals` RUM beacon for real-field INP. **Decision: no
`web-vitals` beacon in this epic.** Cloudflare Web Analytics already collects field CWV/RUM (incl.
INP) via the Performance API, cookieless and with zero extra client JS — that is the intended source,
so we avoid double-instrumenting. Revisit only if Cloudflare's RUM proves insufficient, as part of
#146 / #60.
