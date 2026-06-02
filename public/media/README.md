# Local media placeholders

`PUBLIC_MEDIA_BASE_URL` defaults to `/media`, so `mediaUrl()` resolves photo and download paths to
this directory during local development. The files here are **lightweight placeholders** only.

Real photos and downloadables are **not** committed to git (we avoid Git LFS and repo bloat). In
the Hosting epic (#67) they move to a Cloudflare R2 bucket exposed at `https://media.rsicarelli.com`
and `PUBLIC_MEDIA_BASE_URL` is pointed at it — no code change needed; only the keys in
`src/content/{photos,materials}` need to match the object keys in R2 (the bucket root maps to the
media base, so `src: photos/foo.jpg` ⇄ object key `photos/foo.jpg`).

Upload the real assets with [`scripts/upload-media.sh`](../../scripts/upload-media.sh) (mirrors a
local source directory into the bucket, preserving relative keys). See `docs/deploy-runbook.md`.
