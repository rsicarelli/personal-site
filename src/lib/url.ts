/**
 * URL safety helpers.
 *
 * `isHttpUrl` gates content-authored URLs (which render straight into `href`/`src`) to the http(s)
 * schemes only — rejecting `javascript:`, `data:`, `vbscript:`, `mailto:`, relative paths and junk.
 * Author frontmatter is trusted today, but this is cheap defense-in-depth: if any URL field ever
 * carries untrusted input, a `javascript:`/`data:` href would be a stored-XSS vector. Used by the
 * Zod content schema (src/content.config.ts) via a `.refine()`.
 */
export function isHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}
