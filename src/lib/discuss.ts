import type { UIKey } from '@/i18n/ui';

/**
 * Off-site discussion links for a blog post (#196).
 *
 * Pure builder (mirrors `src/lib/share.ts`) so the ordering/filtering is unit-testable. Channels the
 * developer audience's existing habits (HN / Reddit / Lobsters / Mastodon) instead of hosting the
 * conversation; pairs with the always-present "Reply via email" link rendered by the component.
 */
export interface DiscussInput {
  hn?: string;
  reddit?: string;
  lobsters?: string;
  mastodon?: string;
}

export interface DiscussLink {
  id: 'hn' | 'reddit' | 'lobsters' | 'mastodon';
  /** i18n key for the accessible label (e.g. "Discuss on Hacker News"). */
  labelKey: UIKey;
  /** Visible brand name (not localized). */
  name: string;
  /** The external discussion URL from frontmatter. */
  href: string;
}

const TARGETS = [
  { id: 'hn', labelKey: 'blog.discuss.hn', name: 'Hacker News' },
  { id: 'reddit', labelKey: 'blog.discuss.reddit', name: 'Reddit' },
  { id: 'lobsters', labelKey: 'blog.discuss.lobsters', name: 'Lobsters' },
  { id: 'mastodon', labelKey: 'blog.discuss.mastodon', name: 'Mastodon' },
] as const satisfies readonly { id: DiscussLink['id']; labelKey: UIKey; name: string }[];

/** Ordered discussion links for the provided URLs; `[]` when none are set. */
export function discussLinks(discuss?: DiscussInput): DiscussLink[] {
  if (!discuss) return [];
  return TARGETS.flatMap((t) => {
    const href = discuss[t.id as keyof DiscussInput];
    return href ? [{ id: t.id, labelKey: t.labelKey, name: t.name, href }] : [];
  });
}
