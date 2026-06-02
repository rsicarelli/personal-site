import { PUBLIC_MEDIA_BASE_URL } from 'astro:env/client';

/**
 * Resolve a media path against the configured base URL.
 *
 * Photos and downloadable materials are NOT stored in git (we avoid Git LFS and repo bloat) —
 * only their metadata lives in `src/content/{photos,materials}`. The base is a local placeholder
 * dir today (`/media` → `public/media/`) and flips to the Cloudflare R2 public URL via the
 * `PUBLIC_MEDIA_BASE_URL` env var in the Hosting epic (#67), with no code change here.
 *
 * These `src`/`file` strings are deliberately plain URLs, not `astro:assets` imports — that's the
 * trade for keeping heavy media out of the repo (no build-time optimization for these).
 */
export function mediaUrl(path: string): string {
  const base = PUBLIC_MEDIA_BASE_URL.replace(/\/+$/, '');
  const rel = path.replace(/^\/+/, '');
  return `${base}/${rel}`;
}
