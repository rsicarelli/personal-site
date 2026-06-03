// @ts-check
/**
 * rehype-r2-images — upgrade R2-hosted blog `<img>`s to responsive, edge-transformed markup (#186).
 *
 * Blog markdown links images as plain absolute URLs on the R2 media domain. Astro leaves those as
 * untouched remote `<img>`s (the host is intentionally NOT in `image.remotePatterns`, so there is
 * **no build-time fetch**). This rehype pass rewrites each such `<img>` to:
 *   - `src` + `srcset` pointing at Cloudflare `/cdn-cgi/image/` transforms (`format=auto` → AVIF/WebP),
 *   - `sizes` for responsive selection,
 *   - explicit `width`/`height` from the committed dimensions manifest (zero CLS, no network),
 *   - `loading="lazy"` + `decoding="async"`.
 *
 * Non-media images (dev.to covers, local assets, etc.) are left exactly as-is. Dimensions come from
 * `media-dimensions.json`, baked once by `scripts/media-dimensions.mjs`; a missing entry fails the
 * build loudly rather than shipping a CLS-causing dimensionless image.
 */
import dims from './media-dimensions.json' with { type: 'json' };
import { mediaKey, responsiveImage } from './media-image.mjs';

/** @type {Record<string, [number, number]>} */
const DIMS = /** @type {any} */ (dims);

/**
 * @param {any} node
 * @param {(n: any) => void} fn
 */
function walk(node, fn) {
  fn(node);
  if (node && Array.isArray(node.children)) for (const child of node.children) walk(child, fn);
}

export function rehypeR2Images() {
  /** @param {any} tree */
  return (tree) => {
    walk(tree, (node) => {
      if (!node || node.type !== 'element' || node.tagName !== 'img') return;
      const props = node.properties || (node.properties = {});
      if (typeof props.src !== 'string') return;
      const key = mediaKey(props.src);
      if (!key) return; // not an R2 media image — leave untouched
      const dim = DIMS[key];
      if (!dim) {
        throw new Error(
          `[rehype-r2-images] no baked dimensions for "${key}". Run: node scripts/media-dimensions.mjs`,
        );
      }
      const img = responsiveImage(key, dim);
      props.src = img.src;
      props.srcset = img.srcset;
      props.sizes = img.sizes;
      props.width = img.width;
      props.height = img.height;
      if (props.loading == null) props.loading = 'lazy';
      if (props.decoding == null) props.decoding = 'async';
    });
  };
}
