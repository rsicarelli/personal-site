# Local media placeholders

`PUBLIC_MEDIA_BASE_URL` defaults to `/media`, so `mediaUrl()` resolves photo and download paths to
this directory during local development. The files here are **lightweight placeholders** only.

Real photos and downloadables are **not** committed to git (we avoid Git LFS and repo bloat). In
the Hosting epic (#67) they move to a Cloudflare R2 bucket and `PUBLIC_MEDIA_BASE_URL` is pointed at
its public base — no code change needed; only the filenames in `src/content/{photos,materials}`
need to match what's in R2.
