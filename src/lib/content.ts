import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { LOCALES, type Locale } from '@/config/site';

/**
 * The content spine — the single place every listing and `[...slug]` route uses to turn the
 * content collections into locale-aware, slug-addressable entries.
 *
 * Why this exists: the glob loader slugifies entry `id`s and DROPS DOTS (`about.en` → `abouten`),
 * so the `id` is useless for routing. The reliable key is `entry.filePath` — the real filename,
 * which carries the `.<en|pt>.<ext>` locale marker. We parse it with the SAME regex the
 * locale-completeness guardrail uses (scripts/check-locale-completeness.mjs), so a file the
 * guardrail accepts is always a file these helpers can route, and vice-versa.
 */

/** On-disk locale suffix (`en`|`pt`) → URL Locale (`en`|`pt-br`). Inverse of i18n `contentSuffix`. */
const SUFFIX_TO_LOCALE = { en: 'en', pt: 'pt-br' } as const satisfies Record<string, Locale>;
type DiskSuffix = keyof typeof SUFFIX_TO_LOCALE;

/** `<slug>.<en|pt>.<md|mdx|yaml|yml>` — kept identical to the guardrail's regex (firm constraint #1). */
const LOCALE_FILE = /^(?<slug>.+)\.(?<suffix>en|pt)\.(?:mdx?|ya?ml)$/;

export interface LocalizedEntry<C extends CollectionKey> {
  /** Clean URL slug: dots kept, page-bundle trailing `/index` collapsed (`post/index` → `post`). */
  slug: string;
  locale: Locale;
  entry: CollectionEntry<C>;
}

/** Parse one `filePath` into its logical slug + locale, or `null` if it isn't a locale-suffixed file. */
function parseLocaleFile(
  filePath: string,
  collection: string,
): { slug: string; locale: Locale } | null {
  // filePath is like `src/content/<collection>/<rest>`; parse the part after the collection dir,
  // exactly as the guardrail does (so flat files and page bundles are handled the same way).
  const marker = `/${collection}/`;
  const idx = filePath.lastIndexOf(marker);
  const rel = idx >= 0 ? filePath.slice(idx + marker.length) : filePath;
  const match = rel.match(LOCALE_FILE);
  if (!match?.groups) return null;
  // Collapse a page-bundle's trailing `/index` so `post.en.mdx` and `post/index.en.mdx` agree.
  const slug = match.groups.slug.replace(/\/index$/, '');
  return { slug, locale: SUFFIX_TO_LOCALE[match.groups.suffix as DiskSuffix] };
}

/** A draft is hidden from listings & routes in production builds, but kept visible in `dev`. */
function isDraft(entry: CollectionEntry<CollectionKey>): boolean {
  return (entry.data as { draft?: boolean }).draft === true;
}

/** Sort key: newest first by `pubDate`/`startDate` when present, then by slug for stability. */
function timeOf(entry: CollectionEntry<CollectionKey>): number {
  const data = entry.data as { pubDate?: Date; startDate?: Date };
  const date = data.pubDate ?? data.startDate;
  return date instanceof Date ? date.getTime() : 0;
}

/**
 * Every entry of `collection` in one locale, draft-filtered (in prod), newest-first. Throws on a
 * duplicate logical slug — that only happens if a flat file and a page bundle claim the same slug,
 * which would otherwise surface as Astro's opaque duplicate-route error.
 */
export async function getLocalizedEntries<C extends CollectionKey>(
  collection: C,
  locale: Locale,
): Promise<LocalizedEntry<C>[]> {
  const seen = new Map<string, string>();
  const out: LocalizedEntry<C>[] = [];
  for (const entry of await getCollection(collection)) {
    const parsed = entry.filePath ? parseLocaleFile(entry.filePath, collection) : null;
    if (!parsed || parsed.locale !== locale) continue;
    if (import.meta.env.PROD && isDraft(entry)) continue;
    const prior = seen.get(parsed.slug);
    if (prior) {
      throw new Error(
        `Duplicate logical slug "${parsed.slug}" in collection "${collection}" (${locale}): ` +
          `${prior} and ${entry.filePath}. Don't mix a flat file and a page bundle for one slug.`,
      );
    }
    seen.set(parsed.slug, entry.filePath ?? parsed.slug);
    out.push({ slug: parsed.slug, locale, entry });
  }
  return out.sort((a, b) => timeOf(b.entry) - timeOf(a.entry) || a.slug.localeCompare(b.slug));
}

/** A single entry by `(collection, locale, slug)` — for bespoke pages and `[...slug]` detail routes. */
export async function getLocalizedEntry<C extends CollectionKey>(
  collection: C,
  locale: Locale,
  slug: string,
): Promise<LocalizedEntry<C> | undefined> {
  return (await getLocalizedEntries(collection, locale)).find((e) => e.slug === slug);
}

/** URL-safe tag slug. Tags are free-text in frontmatter; this normalizes them for routing. */
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tag slugs present in published blog posts of EVERY locale. Only these get a tag-archive page, so
 * `BaseLayout`'s reciprocal hreflang never points at a `/pt-br/` (or `/en/`) tag page that 404s.
 * Tags are language-neutral technical terms (`kotlin`, `kmp`) displayed verbatim — not translated.
 */
export async function commonBlogTagSlugs(): Promise<Set<string>> {
  const perLocale = await Promise.all(
    LOCALES.map(async (locale) => {
      const posts = await getLocalizedEntries('blog', locale);
      return new Set(posts.flatMap(({ entry }) => entry.data.tags.map(slugifyTag)));
    }),
  );
  return new Set([...perLocale[0]].filter((slug) => perLocale.every((set) => set.has(slug))));
}

/** Read a blog post's series slug + part order (typed accessors for the un-narrowed entry data). */
function seriesOf(entry: CollectionEntry<'blog'>): string | undefined {
  return entry.data.series;
}
function seriesOrderOf(entry: CollectionEntry<'blog'>): number {
  return entry.data.seriesOrder ?? 0;
}

export interface SeriesWithCount {
  /** Series slug (its filePath-derived id), e.g. `kmp-101`. */
  slug: string;
  locale: Locale;
  data: CollectionEntry<'series'>['data'];
  /** Number of published posts in this series for the locale. */
  count: number;
  /** `/`<locale>`/series/`<slug> landing URL. */
  href: string;
}

/**
 * Series that have at least one published post in `locale`, each with its post count, ordered for
 * the spotlight: explicit `order` first, then most posts, then slug. Empty series are dropped so the
 * spotlight never shows a series with nothing to read.
 */
export async function getSeriesWithCounts(locale: Locale): Promise<SeriesWithCount[]> {
  const [seriesEntries, posts] = await Promise.all([
    getLocalizedEntries('series', locale),
    getLocalizedEntries('blog', locale),
  ]);
  const counts = new Map<string, number>();
  for (const { entry } of posts) {
    const s = seriesOf(entry);
    if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return seriesEntries
    .map(({ slug, entry }) => ({
      slug,
      locale,
      data: entry.data,
      count: counts.get(slug) ?? 0,
      href: `/${locale}/series/${slug}`,
    }))
    .filter((s) => s.count > 0)
    .sort(
      (a, b) =>
        (a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER) ||
        b.count - a.count ||
        a.slug.localeCompare(b.slug),
    );
}

/** Published posts of one series in a locale, ordered by `seriesOrder` (part 1 → N). */
export async function getSeriesPosts(
  locale: Locale,
  seriesSlug: string,
): Promise<LocalizedEntry<'blog'>[]> {
  const posts = await getLocalizedEntries('blog', locale);
  return posts
    .filter(({ entry }) => seriesOf(entry) === seriesSlug)
    .sort((a, b) => seriesOrderOf(a.entry) - seriesOrderOf(b.entry));
}

/** `getStaticPaths` builder: the (locale × slug) product for a `[locale]/.../[...slug]` route. */
export async function localizedPaths<C extends CollectionKey>(
  collection: C,
): Promise<{ params: { locale: Locale; slug: string }; props: { entry: CollectionEntry<C> } }[]> {
  const paths: {
    params: { locale: Locale; slug: string };
    props: { entry: CollectionEntry<C> };
  }[] = [];
  for (const locale of LOCALES) {
    for (const { slug, entry } of await getLocalizedEntries(collection, locale)) {
      paths.push({ params: { locale, slug }, props: { entry } });
    }
  }
  return paths;
}
