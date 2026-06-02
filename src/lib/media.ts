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

/**
 * Extract the YouTube video id from a watch / share / embed URL, for the `ui/LiteYouTube` facade
 * (which takes the bare id, not a URL). Returns null if it isn't a recognizable YouTube URL.
 */
export function youtubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    return embed ? embed[1] : null;
  } catch {
    return null;
  }
}
