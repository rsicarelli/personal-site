# Comments runbook (#195)

How `rsicarelli.com` does blog comments: **Giscus** (GitHub Discussions), **cookieless** on our domain,
**per-locale**, and **env-gated** — the component (and the giscus client script) ship **nothing** until
the `PUBLIC_GISCUS_*` vars are set, exactly like Umami (`docs/analytics.md`). Decision rationale lives in
`docs/engagement-strategy.md`; privacy disclosure is on `/en/privacy` + `/pt-br/privacy` (#193).

## Architecture

| Concern          | Choice                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| Backend          | **GitHub Discussions** in this repo (comments are portable, version-controlled)     |
| Embed            | **Giscus** `client.js`, `data-loading="lazy"`, injected on `astro:page-load`        |
| Threads          | `mapping: pathname` → `/en/…` and `/pt-br/…` are **separate**, language-matched     |
| Language         | `data-lang` = `pt` for pt-BR, else `en`                                             |
| Theme            | synced to the site light/dark toggle (postMessage on `.dark` class change)          |
| Cookies          | **none on our domain**; Giscus stores a token in `localStorage` only after GH login |
| Moderation       | native GitHub Discussions (hide/delete/lock, block users)                           |
| Per-post opt-out | `comments: false` in a post's frontmatter (default is on)                           |

Already wired in-repo: the `Comments.astro` component (rendered at the bottom of each post), the
`PUBLIC_GISCUS_*` env schema, the CSP allowances for `https://giscus.app` (`public/_headers`), and the
`tests/security/csp-hashes.test.ts` guard. Nothing renders until the steps below are done.

## Provisioning Giscus (owner-only)

1. **Enable Discussions:** repo **Settings → General → Features → ✅ Discussions**.
2. **Create a category:** repo **Discussions → Categories → New** → e.g. **“Comments”**, format
   **“Announcement”** (only maintainers open threads; Giscus still creates one per post on first comment).
3. **Install the Giscus app:** <https://github.com/apps/giscus> → install on **`rsicarelli/personal-site`** only.
4. **Get the IDs:** open <https://giscus.app>, enter the repo and pick the category. Copy the four values
   it generates: `data-repo` (`rsicarelli/personal-site`), `data-repo-id` (`R_…`), `data-category`
   (`Comments`), `data-category-id` (`DIC_…`).
5. **Set the env vars** in the **Cloudflare Pages** project → **Settings → Environment variables**, for
   **Production AND Preview**:
   - `PUBLIC_GISCUS_REPO` = `rsicarelli/personal-site`
   - `PUBLIC_GISCUS_REPO_ID` = `R_…`
   - `PUBLIC_GISCUS_CATEGORY` = `Comments`
   - `PUBLIC_GISCUS_CATEGORY_ID` = `DIC_…`
     Leave them blank locally (`.env.example` keeps them stubbed).
6. **Redeploy** and verify on a post: the comment box renders below the article, light/dark follows the
   theme toggle, and `/en/blog/<slug>` vs `/pt-br/blog/<slug>` are separate threads. With all four vars
   unset (dev/CI), no giscus script is emitted at all (asserted by `tests/seo/comments.test.ts`).

## Notes

- **No consent banner.** Giscus sets no cookies on our domain; it only writes a token to `localStorage`
  after the visitor signs in with GitHub. Covered by the privacy policy (#193), which lists GitHub as
  the controller for comment data and points erasure to GitHub account controls + deleting the Discussion.
- **CSP.** `https://giscus.app` is allow-listed in `script-src`, `connect-src` and `frame-src`. The
  inline loader’s hash is pinned in `public/_headers` (the guard test recomputes it from source).
- **Non-GitHub readers** can’t comment (the GitHub-account wall). If that measurably suppresses
  engagement, the deferred fallback is the icebox issue (#204) — Remark42 or a D1-backed system.
