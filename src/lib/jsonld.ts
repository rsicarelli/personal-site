import type { CollectionEntry } from 'astro:content';
import type { Locale } from '@/config/site';
import { hreflangOf } from '@/i18n/utils';
import { isoDate } from '@/lib/datetime';

/**
 * JSON-LD builders (#52) — turn the Zod-typed content frontmatter into schema.org nodes. Pure
 * functions returning plain objects (no `@context`, no stringify, no Astro globals): the
 * `JsonLd.astro` component wraps them in a single `@graph` document and serializes. Schemas are
 * intentionally semantic in `content.config.ts` (blog→BlogPosting, portfolio→SoftwareSourceCode/
 * CreativeWork, events→Event, cv→Person) so this wiring stays mechanical.
 *
 * Dates use `isoDate` (UTC `YYYY-MM-DD`) — the same source the visible `<time>` elements use, so
 * structured and visible dates can't disagree. `author`/`performer` reference the entity by NAME
 * ONLY (Google requires `author.name` to be just the name); the full Person node — with `sameAs`
 * and `knowsAbout` — lives on the About page and the home graph, not duplicated per post.
 */

export type JsonLdNode = Record<string, unknown>;

/** schema.org Event attendance-mode enum URLs. */
const OFFLINE = 'https://schema.org/OfflineEventAttendanceMode';
const ONLINE = 'https://schema.org/OnlineEventAttendanceMode';

/** Person — full identity node (name only on `author` refs; this is the rich one). #59 feeds `sameAs`. */
export function personLd(cv: CollectionEntry<'cv'>['data'], opts: { url: string }): JsonLdNode {
  const current = cv.work[0];
  return {
    '@type': 'Person',
    name: cv.name,
    url: opts.url,
    jobTitle: cv.headline,
    ...(cv.email ? { email: `mailto:${cv.email}` } : {}),
    ...(cv.location ? { homeLocation: { '@type': 'Place', name: cv.location } } : {}),
    ...(cv.knowsAbout.length ? { knowsAbout: cv.knowsAbout } : {}),
    ...(current ? { worksFor: { '@type': 'Organization', name: current.company } } : {}),
    // Entity reconciliation across the web (#59) — GitHub, LinkedIn, X, Sessionize, Stone, …
    ...(cv.profiles.length ? { sameAs: cv.profiles.map((p) => p.url) } : {}),
  };
}

/** WebSite — the site-wide node, one per locale graph. */
export function websiteLd(opts: { url: string; name: string; locale: Locale }): JsonLdNode {
  return {
    '@type': 'WebSite',
    name: opts.name,
    url: opts.url,
    inLanguage: hreflangOf(opts.locale),
  };
}

/** BlogPosting — one per post. `dateModified` falls back to `pubDate` when never updated. */
export function blogPostingLd(
  data: CollectionEntry<'blog'>['data'],
  opts: {
    url: string;
    locale: Locale;
    authorName: string;
    image?: string;
    /** Series display name → `isPartOf` a CreativeWorkSeries (set for series posts). */
    seriesName?: string;
    /** Series landing URL, attached to the CreativeWorkSeries node when present. */
    seriesUrl?: string;
  },
): JsonLdNode {
  return {
    '@type': 'BlogPosting',
    headline: data.title,
    // `abstract` is the answer-first capsule when present; `description` stays the meta/SERP snippet.
    ...(data.summary ? { abstract: data.summary } : {}),
    description: data.description,
    inLanguage: hreflangOf(opts.locale),
    datePublished: isoDate(data.pubDate),
    dateModified: isoDate(data.updatedDate ?? data.pubDate),
    url: opts.url,
    mainEntityOfPage: opts.url,
    author: { '@type': 'Person', name: opts.authorName },
    ...(data.tags.length ? { keywords: data.tags } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    // Series membership (#31) → a CreativeWorkSeries the post `isPartOf`, with its part position.
    ...(opts.seriesName
      ? {
          isPartOf: {
            '@type': 'CreativeWorkSeries',
            name: opts.seriesName,
            ...(opts.seriesUrl ? { url: opts.seriesUrl } : {}),
          },
          ...(data.seriesOrder != null ? { position: data.seriesOrder } : {}),
        }
      : {}),
  };
}

/** Portfolio entry → SoftwareSourceCode when it has a repo, else CreativeWork. */
export function creativeWorkLd(
  data: CollectionEntry<'portfolio'>['data'],
  opts: { url: string; locale: Locale; authorName: string; image?: string },
): JsonLdNode {
  return {
    '@type': data.repo ? 'SoftwareSourceCode' : 'CreativeWork',
    name: data.title,
    description: data.description,
    inLanguage: hreflangOf(opts.locale),
    url: opts.url,
    author: { '@type': 'Person', name: opts.authorName },
    ...(data.repo ? { codeRepository: data.repo, programmingLanguage: data.tech } : {}),
    ...(!data.repo && data.tech.length ? { keywords: data.tech } : {}),
    ...(opts.image ? { image: opts.image } : {}),
  };
}

/** Event — talks/appearances. Offline when a physical location is set, else a VirtualLocation. */
export function eventLd(
  data: CollectionEntry<'events'>['data'],
  opts: { url: string; locale: Locale; performerName: string },
): JsonLdNode {
  return {
    '@type': 'Event',
    name: data.title,
    description: data.description,
    inLanguage: hreflangOf(opts.locale),
    startDate: isoDate(data.startDate),
    ...(data.endDate ? { endDate: isoDate(data.endDate) } : {}),
    eventAttendanceMode: data.location ? OFFLINE : ONLINE,
    location: data.location
      ? { '@type': 'Place', name: data.location }
      : { '@type': 'VirtualLocation', url: data.url ?? opts.url },
    performer: { '@type': 'Person', name: opts.performerName },
    url: opts.url,
  };
}

/** BreadcrumbList — `items` already ordered Home → Section → current page. */
export function breadcrumbLd(items: { name: string; url: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** FAQPage — consumed by the answer-first FAQ component (#56). */
export function faqPageLd(items: { question: string; answer: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  };
}
