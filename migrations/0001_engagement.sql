-- Engagement backend schema (#199) — Cloudflare D1 (SQLite).
--
-- Lays the tables the cookieless engagement features build on: view counts (#200), anonymous
-- reactions (#201), and the short-lived dedup ledger shared by both. D1 (not KV) backs counters:
-- its free tier allows ~100k row writes/day and a single-statement upsert avoids the last-write-wins
-- races KV would introduce. Apply with `wrangler d1 migrations apply` (see docs/backend.md).

-- View / like counts: one row per (slug, kind). Incremented with an atomic upsert:
--   INSERT INTO counters (slug, kind, count) VALUES (?1, ?2, 1)
--   ON CONFLICT(slug, kind) DO UPDATE SET count = count + 1;
CREATE TABLE IF NOT EXISTS counters (
  slug  TEXT NOT NULL,
  kind  TEXT NOT NULL,          -- 'view' | 'like' | ...
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, kind)
);

-- Anonymous reactions (#201): one row per (slug, emoji).
CREATE TABLE IF NOT EXISTS reactions (
  slug  TEXT NOT NULL,
  emoji TEXT NOT NULL,          -- e.g. '👍','🎉','❤️','🚀'
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, emoji)
);

-- Short-lived dedup ledger: hash = SHA-256(daily_salt + slug + IP + UA), so a visit counts once per
-- day with no PII stored (#200/#201). A daily cron prunes rows by `ts` (cleanup index below).
CREATE TABLE IF NOT EXISTS dedup (
  hash TEXT PRIMARY KEY,
  ts   INTEGER NOT NULL         -- unix epoch (seconds) of first sighting
);
CREATE INDEX IF NOT EXISTS idx_dedup_ts ON dedup (ts);
