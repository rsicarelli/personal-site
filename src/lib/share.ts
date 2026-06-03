import type { UIKey } from '@/i18n/ui';

/**
 * Share targets for a blog post (#194) — trackerless, cookieless, no share counts.
 *
 * Pure URL builder kept separate from the component so the encoding is unit-testable without a
 * build. Every target is a plain link the browser opens directly (intent endpoints / `mailto:`),
 * so there is no third-party SDK and nothing runs until the reader clicks. Mastodon/fediverse are
 * intentionally NOT a static link (no universal per-instance URL) — they're covered by the native
 * OS share sheet + "Copy link" in `ShareButtons.astro`.
 */
export interface ShareTarget {
  id: 'twitter' | 'bluesky' | 'linkedin' | 'email';
  /** i18n label key (also the accessible name) — resolved by the component via `useTranslations`. */
  labelKey: UIKey;
  /** Ready-to-use `href` with the post URL/title already percent-encoded. */
  href: string;
}

/**
 * Build the ordered share links for a post. `url` must be the absolute canonical post URL
 * (from `canonicalUrl()`); `title` is the post title. All interpolated values are
 * `encodeURIComponent`-ed so titles with spaces/`&`/diacritics stay valid.
 */
export function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  // Bluesky's compose intent takes a single free-text field; include the title + URL.
  const blueskyText = encodeURIComponent(`${title} ${url}`);
  // Email body: title, blank line, URL.
  const emailBody = encodeURIComponent(`${title}\n\n${url}`);

  return [
    {
      id: 'twitter',
      labelKey: 'blog.share.twitter',
      href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    },
    {
      id: 'bluesky',
      labelKey: 'blog.share.bluesky',
      href: `https://bsky.app/intent/compose?text=${blueskyText}`,
    },
    {
      id: 'linkedin',
      labelKey: 'blog.share.linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
    {
      id: 'email',
      labelKey: 'blog.share.email',
      href: `mailto:?subject=${t}&body=${emailBody}`,
    },
  ];
}
