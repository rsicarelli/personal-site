import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

/**
 * Inject `minutesRead` into each Markdown/MDX file's frontmatter so the blog post template can
 * read it via `render()`'s `remarkPluginFrontmatter`. It runs on the parsed prose AST (via
 * mdast-util-to-string), so import/JSX lines and frontmatter don't inflate the count. Reading
 * time is derived, never authored — it has no place in the Zod schema.
 */
export function remarkReadingTime() {
  return function (tree, file) {
    const minutes = Math.max(1, Math.round(getReadingTime(toString(tree)).minutes));
    file.data.astro.frontmatter.minutesRead = minutes;
  };
}
