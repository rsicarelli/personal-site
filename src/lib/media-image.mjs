// @ts-check
/**
 * media-image — Cloudflare Image Transformations helper for R2-hosted blog media (#186).
 *
 * Blog markdown references images as plain absolute URLs on the R2 media domain
 * (`https://media.rsicarelli.com/<key>`). This helper turns a key + its intrinsic size into
 * responsive `<img>` props that point at Cloudflare's `/cdn-cgi/image/<opts>/<key>` endpoint
 * (`format=auto` negotiates AVIF/WebP per request, resized at the edge — no build-time work).
 *
 * The transform URL shape here is the one verified against the live zone (#185). Provider logic is
 * deliberately isolated in this one module so it can be swapped (e.g. for `@unpic`) without touching
 * callers. We don't use `@unpic` directly because its Cloudflare preset defaults to `fit=cover`
 * (which would crop content images) and a different URL shape than our validated endpoint.
 */

const MEDIA_HOST = 'media.rsicarelli.com';

/** Responsive width breakpoints (px). Filtered per image so we never upscale past the original. */
const WIDTH_LADDER = [320, 480, 640, 768, 1024, 1366, 1920];

/** Default `sizes`: prose column caps near the reading measure on wide screens, full width below. */
export const DEFAULT_SIZES = '(min-width: 768px) 768px, 100vw';

/**
 * The R2 object key (path, no leading slash) for a media-domain URL, or `null` if `src` is not one.
 * @param {string} src
 * @returns {string | null}
 */
export function mediaKey(src) {
  try {
    const u = new URL(src);
    return u.host === MEDIA_HOST ? u.pathname.replace(/^\/+/, '') : null;
  } catch {
    return null;
  }
}

/**
 * A single Cloudflare transform URL for `key` at width `w` (format=auto → AVIF/WebP).
 * @param {string} key
 * @param {number} w
 * @returns {string}
 */
export function cfTransform(key, w) {
  return `https://${MEDIA_HOST}/cdn-cgi/image/width=${w},format=auto/${key}`;
}

/**
 * @typedef {Object} ResponsiveImage
 * @property {string} src     Default (fallback) transform URL.
 * @property {string} srcset  Width-descriptor candidates (`…/width=N… Nw, …`).
 * @property {string} sizes   The `sizes` attribute.
 * @property {number} width   Intrinsic width (→ `width` attr, kills CLS).
 * @property {number} height  Intrinsic height (→ `height` attr).
 */

/**
 * Build responsive image props for an R2 `key` given its intrinsic `[width, height]`.
 * Candidate widths are capped at the intrinsic width (no upscaling).
 * @param {string} key
 * @param {[number, number]} dims
 * @param {string} [sizes]
 * @returns {ResponsiveImage}
 */
export function responsiveImage(key, [width, height], sizes = DEFAULT_SIZES) {
  let widths = WIDTH_LADDER.filter((w) => w <= width);
  if (widths.length === 0) widths = [width];
  const srcset = widths.map((w) => `${cfTransform(key, w)} ${w}w`).join(', ');
  const fallback = widths.find((w) => w >= 768) ?? widths[widths.length - 1];
  return { src: cfTransform(key, fallback), srcset, sizes, width, height };
}
