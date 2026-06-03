# Engagement backend runbook (#199)

The cookieless backend that powers view counts (#200), anonymous reactions (#201) and their
spam/abuse controls (#202). Architecture decisions in `docs/engagement-strategy.md`.

## Architecture

| Concern   | Choice                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Site      | stays a **fully static** Astro build — **no adapter** (`output: static`)                                                                |
| Compute   | **Cloudflare Pages Functions** in `functions/**`, deployed alongside `dist/`                                                            |
| Database  | **Cloudflare D1** (SQLite), bound as `DB` — D1 (not KV) for counters (see migration)                                                    |
| Config    | bindings via the **Cloudflare dashboard**, NOT a `wrangler.jsonc` (which would make the build ignore the dashboard env vars — see #209) |
| Typecheck | `functions/` is excluded from `astro check` (Cloudflare bundles it with its own esbuild)                                                |

`functions/api/health.ts` (`GET /api/health`) is the first endpoint; it doubles as a **binding
check** — it reports `{ ok, db, time }` where `db` is `true` only when the D1 binding answers.

## Provisioning (owner-only)

1. **Create the databases** (one for prod, a separate one for previews so previews never write to
   production data):
   ```bash
   npx wrangler d1 create personal-site-engagement
   npx wrangler d1 create personal-site-engagement-preview
   ```
2. **Apply the migration** to each:
   ```bash
   npx wrangler d1 migrations apply personal-site-engagement --remote
   npx wrangler d1 migrations apply personal-site-engagement-preview --remote
   ```
   (Wrangler reads `migrations/` by default; `0001_engagement.sql` creates `counters`, `reactions`,
   `dedup`.)
3. **Bind them in the dashboard** → Cloudflare Pages project → **Settings → Functions → D1 database
   bindings**. Add the **same variable name `DB`** in both environments:
   - **Production** → `personal-site-engagement`
   - **Preview** → `personal-site-engagement-preview`
4. **Redeploy** and verify:
   ```bash
   curl https://rsicarelli.com/api/health      # {"ok":true,"db":true,...}
   ```
   `db:true` means the binding is live. With no binding, the endpoint still returns `ok:true` /
   `db:false` (so the route is safe to ship before the DB exists).

## Endpoints

| Route                  | What it does                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `GET /api/health`      | binding check — `{ ok, db, time }`                                                     |
| `POST /api/view`       | cookieless view count (#200) — `{ "path": "/en/blog/<slug>" }`; same-origin only       |
| `GET /api/view?path=…` | read the aggregate `{ path, views }` (author/future use — no on-page number by design) |

**View counting (#200)** dedups a reader with `SHA-256(dailySalt + path + IP + UA)` where
`dailySalt = SHA-256(VIEW_SALT_SECRET + UTC-date)` — raw IP/UA are never stored and the salt rotates
daily (no KV/cron). Only **allowlisted** paths (from the build-time `/engagement/slugs.json`) are
counted. Requires one extra owner-only secret:

- Add **`VIEW_SALT_SECRET`** (a long random string, e.g. `openssl rand -hex 32`) in Cloudflare Pages →
  **Settings → Variables and Secrets**, **type Secret**, for **Production AND Preview**.

Verify after deploy (open a post, wait ~3s, then):

```bash
curl "https://rsicarelli.com/api/view?path=/en/blog/<slug>"   # {"path":"…","views":N} — increments
```

## Local development (optional)

Pages Functions don't run under `astro dev`. To exercise them locally, build then serve with a local
D1:

```bash
pnpm build
npx wrangler pages dev dist --d1 DB=personal-site-engagement-preview
```

## Notes

- **No `wrangler.jsonc`.** We deliberately don't ship a Wrangler config file — with one present the
  Pages build ignores the dashboard environment variables (that broke Giscus/Umami, #209). D1
  bindings are set in the dashboard instead, which has no such conflict.
- **Migrations are forward-only**; add `migrations/000N_*.sql` and re-run `migrations apply`.
- Future endpoints (`/api/view`, `/api/react`) live beside `health.ts` and reuse the `DB` binding +
  the salted-hash `dedup` table.
