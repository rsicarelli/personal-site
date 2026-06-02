import { PUBLIC_SITE_URL } from 'astro:env/client';
import type { UIKey } from '@/i18n/ui';

/**
 * Single source of truth for site-wide constants. Import from here instead of hard-coding
 * strings across pages/components. The typed env value comes from astro:env (see
 * astro.config.mjs) so a missing/invalid PUBLIC_SITE_URL fails the build.
 */
export const SITE = {
  url: PUBLIC_SITE_URL,
  name: 'Rodrigo Sicarelli',
  title: 'rsicarelli.com',
  description:
    'Rodrigo Sicarelli — Staff Software Engineer, Kotlin Multiplatform authority, speaker and OSS maintainer.',
} as const;

/**
 * Supported locales. The i18n epic (#19/#20) consumes these to drive subdirectory routing
 * (`/en/` + `/pt-br/`) and browser-locale detection at `/` only — never a hard redirect.
 */
export const LOCALES = ['en', 'pt-br'] as const;
export const DEFAULT_LOCALE: Locale = 'en';
export type Locale = (typeof LOCALES)[number];

/**
 * Primary navigation — IA from research §05. `key` resolves to a localized label via the i18n
 * dictionary (src/i18n/ui.ts); `href` is locale-agnostic and gets a `/<locale>` prefix at render
 * (see Header). Typing `key` as `UIKey` makes a stale/typo'd key a typecheck error.
 */
export const NAV = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.blog', href: '/blog' },
  { key: 'nav.projects', href: '/projects' },
  { key: 'nav.talks', href: '/talks' },
  { key: 'nav.about', href: '/about' },
  { key: 'nav.contact', href: '/contact' },
] as const satisfies readonly { key: UIKey; href: string }[];

/** Secondary footer links — §05. Same `key`/`href` contract as NAV. */
export const FOOTER_LINKS = [
  { key: 'footer.photos', href: '/photos' },
  { key: 'footer.uses', href: '/uses' },
  { key: 'footer.now', href: '/now' },
  { key: 'footer.materials', href: '/materials' },
] as const satisfies readonly { key: UIKey; href: string }[];
