-- Per-IP rate limiting (#202) — Cloudflare D1 (SQLite).
--
-- A shared, fixed-window limiter for every public write endpoint (/api/view, /api/react,
-- /api/subscribe). One row per (salted-IP, endpoint bucket, time window); the window is encoded in
-- the key, so a new window starts a fresh row and old rows are pruned by `ts`. The key is a one-way
-- SHA-256(dailySalt + IP + bucket + windowStart) — the raw IP is never stored, mirroring the `dedup`
-- ledger. Apply with `wrangler d1 migrations apply` (see docs/backend.md).

CREATE TABLE IF NOT EXISTS ratelimit (
  key   TEXT PRIMARY KEY,      -- SHA-256(dailySalt + IP + bucket + windowStart), hex
  count INTEGER NOT NULL DEFAULT 0,
  ts    INTEGER NOT NULL       -- window-start unix epoch (seconds); drives the cleanup prune
);
CREATE INDEX IF NOT EXISTS idx_ratelimit_ts ON ratelimit (ts);
