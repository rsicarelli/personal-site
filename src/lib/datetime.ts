import { hreflangOf } from '@/i18n/utils';
import type { Locale } from '@/config/site';

/**
 * Date helpers — the single source of truth for rendering content dates.
 *
 * Content dates (blog `pubDate`/`updatedDate`, event `startDate`/`endDate`) are **date-only** and,
 * via `z.coerce.date()` on a `YYYY-MM-DD` string, are parsed as **UTC midnight**. Formatting them
 * in the build/runtime's local timezone shifts the calendar day in negative-offset zones (e.g. a
 * `2024-07-29` talk rendering as "Jul 28" in UTC−3). So both helpers below pin to UTC — keeping
 * these in one place means the rule can't drift as new date displays are added.
 */

/** Machine-readable date-only string (`YYYY-MM-DD`, UTC) for the `<time datetime>` attribute. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Human-readable date in the given locale, formatted in UTC (no off-by-one calendar-day shift). */
export function formatDate(
  date: Date,
  locale: Locale,
  dateStyle: 'long' | 'medium' = 'long',
): string {
  return new Intl.DateTimeFormat(hreflangOf(locale), { dateStyle, timeZone: 'UTC' }).format(date);
}
