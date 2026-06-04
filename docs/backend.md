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
   `dedup`; `0002_ratelimit.sql` adds the `ratelimit` table for the per-IP limiter (#202).)
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

| Route             | What it does                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `GET /api/health` | binding check — `{ ok, db, time }`                                                           |
| `POST /api/view`  | cookieless view count (#200) — `{ "path": "/en/blog/<slug>" }`; same-origin only             |
| `POST /api/react` | anonymous reaction (#201) — `{ "path": "/en/blog/<slug>", "emoji": "👍" }`; same-origin only |
| `GET /api/react`  | public per-emoji counts — `?path=/en/blog/<slug>` → `{ path, counts }` (the on-page display) |

**View counting (#200)** dedups a reader with `SHA-256(dailySalt + path + IP + UA)` where
`dailySalt = SHA-256(VIEW_SALT_SECRET + UTC-date)` — raw IP/UA are never stored and the salt rotates
daily (no KV/cron). Only **allowlisted** paths (from the build-time `/engagement/slugs.json`) are
counted. The POST returns only `{ ok, counted }` — it never echoes the total.

**Counts are private — there is NO public read endpoint** (no on-page number by design). Read them
yourself directly from D1:

```bash
npx wrangler d1 execute personal-site-engagement --remote \
  --command "SELECT slug, count FROM counters WHERE kind='view' ORDER BY count DESC LIMIT 50;"
```

Requires one extra owner-only secret:

- Add **`VIEW_SALT_SECRET`** (a long random string, e.g. `openssl rand -hex 32`) in Cloudflare Pages →
  **Settings → Variables and Secrets**, **type Secret**, for **Production AND Preview**. It is the
  **shared engagement salt** — it now seeds the view dedup, the reaction dedup (#201) and the per-IP
  rate limiter (#202). No separate secret is needed.

**Reactions (#201)** are anonymous and dedup the same way as views, with the emoji folded into the
hash (`SHA-256(dailySalt + path + IP + UA + emoji)`) so a reader can react once per emoji per day.
Unlike views, the per-emoji **counts are public** — `GET /api/react?path=…` is the on-page display
source (no PII; edge-cached ~30s). Only allowlisted post paths and the fixed emoji palette
(`functions/_lib/react.ts`) are accepted.

_Seeding from dev.to (#216, owner-run once):_ mirrored posts recorded their dev.to like count in
frontmatter (`provenance.reactions`). After the D1 is live, seed those into our reactions (mapped to
❤️) so posts don't launch at zero. The script prints idempotent SQL (`ON CONFLICT DO NOTHING`, so it
never clobbers a real reader reaction):

```bash
pnpm seed:reactions > /tmp/seed.sql
npx wrangler d1 execute personal-site-engagement --remote --file=/tmp/seed.sql
npx wrangler d1 execute personal-site-engagement-preview --remote --file=/tmp/seed.sql
```

**Rate limiting (#202)** — every public write endpoint (`/api/view`, `/api/react`, `/api/subscribe`)
runs the shared per-IP limiter in `functions/_lib/ratelimit.ts` (fixed window, keyed by a salted IP
hash in the `ratelimit` table — the raw IP is never stored). Over budget → HTTP 429. `/api/subscribe`
only engages the limiter once a `DB` binding is present (honeypot + double opt-in remain its primary
guard). As a network-layer backstop, add a Cloudflare **WAF rate-limit rule** on `/api/*` (e.g. block
above 100 requests/min/IP) in the dashboard.

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
- The write endpoints (`/api/view`, `/api/react`, `/api/subscribe`) live beside `health.ts` and reuse
  the `DB` binding, the salted-hash `dedup` table, and the shared `ratelimit` limiter.
