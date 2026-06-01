import { PUBLIC_SITE_URL } from 'astro:env/client';

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

/** Primary navigation — IA from research §05. Hrefs gain locale prefixes in the i18n epic. */
export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Projects', href: '/projects' },
  { label: 'Talks', href: '/talks' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Secondary footer links — §05. */
export const FOOTER_LINKS = [
  { label: 'Photos', href: '/photos' },
  { label: 'Uses', href: '/uses' },
  { label: 'Now', href: '/now' },
  { label: 'Materials', href: '/materials' },
] as const;
