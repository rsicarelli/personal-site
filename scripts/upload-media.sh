#!/usr/bin/env bash
# Mirror a local media directory into the Cloudflare R2 bucket that backs media.rsicarelli.com.
#
# Photos and downloadable materials are NOT stored in git (we avoid Git LFS and repo bloat) — only
# their metadata lives in src/content/{photos,materials}. Those entries reference relative keys like
# `photos/kotlinconf-2025-stage.jpg`, which mediaUrl() resolves against PUBLIC_MEDIA_BASE_URL. The
# bucket root maps 1:1 to that base, so a file at <src-dir>/photos/foo.jpg uploads to object key
# `photos/foo.jpg` and is served at https://media.rsicarelli.com/photos/foo.jpg.
#
# This is a thin wrapper over `wrangler r2 object put` (no recursive sync exists in wrangler), run
# manually by the repo owner — it is NOT part of the build or deploy. See docs/deploy-runbook.md.
#
# Requires: wrangler (in devDependencies — run via `pnpm dlx wrangler` or the pinned binary) and an
# authenticated Cloudflare session: either `wrangler login`, or CLOUDFLARE_API_TOKEN +
# CLOUDFLARE_ACCOUNT_ID in the environment. NEVER hardcode credentials here.
set -euo pipefail

BUCKET="${R2_BUCKET:-rsicarelli-media}"

usage() {
  cat <<'USAGE'
Usage: scripts/upload-media.sh <local-media-dir> [--bucket <name>] [--dry-run]

Uploads every file under <local-media-dir> to the R2 bucket, preserving relative paths as object
keys (e.g. <dir>/photos/foo.jpg -> object key photos/foo.jpg).

Arguments:
  <local-media-dir>   Directory whose contents mirror the media base (contains photos/, materials/...).

Options:
  --bucket <name>     R2 bucket name (default: $R2_BUCKET or "rsicarelli-media").
  --dry-run           Print what would be uploaded without calling wrangler.
  -h, --help          Show this help.

Auth: run `wrangler login` first, or export CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
Example: scripts/upload-media.sh ~/media-assets --bucket rsicarelli-media
USAGE
}

DRY_RUN=0
SRC_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --bucket) BUCKET="${2:?--bucket needs a value}"; shift 2 ;;
    -*) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) SRC_DIR="$1"; shift ;;
  esac
done

if [ -z "$SRC_DIR" ]; then
  usage >&2
  exit 2
fi
if [ ! -d "$SRC_DIR" ]; then
  echo "Error: '$SRC_DIR' is not a directory." >&2
  exit 1
fi

# Resolve a wrangler invocation: prefer a project-local binary, fall back to pnpm dlx.
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER=(wrangler)
else
  WRANGLER=(pnpm dlx wrangler)
fi

count=0
# Find files (skip dotfiles like .DS_Store); compute the key relative to SRC_DIR.
while IFS= read -r -d '' file; do
  key="${file#"$SRC_DIR"/}"
  echo "→ $key"
  if [ "$DRY_RUN" -eq 0 ]; then
    "${WRANGLER[@]}" r2 object put "$BUCKET/$key" --file "$file" --remote
  fi
  count=$((count + 1))
done < <(find "$SRC_DIR" -type f ! -name '.*' -print0)

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[dry-run] $count file(s) would be uploaded to bucket '$BUCKET'."
else
  echo "✓ Uploaded $count file(s) to bucket '$BUCKET'."
fi
