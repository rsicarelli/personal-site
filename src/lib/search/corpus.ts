import type { CollectionEntry } from 'astro:content';
import type { Locale } from '@/config/site';
import { useTranslations } from '@/i18n/utils';
import type { UIKey } from '@/i18n/ui';
import { getLocalizedEntries, readingTimeOf } from '@/lib/content';
import { formatDate, isoDate } from '@/lib/datetime';
import { SEARCH_TYPES, type SearchDoc, type SearchDocMeta, type SearchType } from './types';

/**
 * Build-time search corpus — flattens the four searchable collections (blog, portfolio, events,
 * materials) into locale-scoped `SearchDoc`s via the content spine (`getLocalizedEntries`: draft-
 * filtered, newest-first). Engines consume this differently — the D1 sync script emits rows from
 * it, the Orama endpoint serializes it, Pagefind ignores it (it scrapes built HTML) — but the doc
 * shape (and therefore the rendered result) stays identical across all of them.
 */

/**
 * Strip markdown/MDX down to indexable plain text: fenced code, inline code markers, image/link
 * syntax (keeping the label), MDX import/export lines, JSX/HTML tags, then leftover punctuation
 * noise. Lossy on purpose — this feeds a search index, not a renderer.
 */
export function plainTextOf(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^(?:import|export)\s.+$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Localized content-type badge for a doc type (`blog` → `Posts` / `Posts`, …). */
export function typeLabelOf(type: SearchType, locale: Locale): string {
  const t = useTranslations(locale);
  return t(`search.type.${type}` as UIKey);
}

function blogDoc(locale: Locale, slug: string, entry: CollectionEntry<'blog'>): SearchDoc {
  const t = useTranslations(locale);
  const d = entry.data;
  const meta: SearchDocMeta[] = [
    { text: formatDate(d.pubDate, locale), iso: isoDate(d.pubDate) },
    { text: `${readingTimeOf(entry)} ${t('blog.minRead')}` },
    { text: t(`blog.topic.${d.topic}` as UIKey) },
  ];
  return {
    id: `blog:${slug}`,
    type: 'blog',
    url: `/${locale}/blog/${slug}`,
    title: d.title,
    excerpt: d.summary ?? d.description,
    body: plainTextOf(entry.body ?? ''),
    tags: d.tags,
    typeLabel: typeLabelOf('blog', locale),
    meta,
  };
}

function projectDoc(locale: Locale, slug: string, entry: CollectionEntry<'portfolio'>): SearchDoc {
  const d = entry.data;
  return {
    id: `project:${slug}`,
    type: 'project',
    url: `/${locale}/projects/${slug}`,
    title: d.title,
    excerpt: d.description ?? '',
    body: plainTextOf(entry.body ?? ''),
    tags: d.tech,
    typeLabel: typeLabelOf('project', locale),
    meta: d.tech.slice(0, 3).map((tech: string) => ({ text: tech })),
  };
}

function talkDoc(locale: Locale, slug: string, entry: CollectionEntry<'events'>): SearchDoc {
  const t = useTranslations(locale);
  const d = entry.data;
  const meta: SearchDocMeta[] = [
    { text: formatDate(d.startDate, locale, 'medium'), iso: isoDate(d.startDate) },
  ];
  if (d.location) meta.push({ text: d.location });
  meta.push({ text: t(`talks.kind.${d.kind}` as UIKey) });
  return {
    id: `talk:${slug}`,
    type: 'talk',
    url: `/${locale}/talks/${slug}`,
    title: d.title,
    excerpt: d.description,
    body: plainTextOf(entry.body ?? ''),
    tags: [],
    typeLabel: typeLabelOf('talk', locale),
    meta,
  };
}

function materialDoc(locale: Locale, slug: string, entry: CollectionEntry<'materials'>): SearchDoc {
  const d = entry.data;
  const items: { title: string; description?: string }[] = d.items ?? [];
  return {
    id: `material:${slug}`,
    type: 'material',
    // Materials have no detail route — every material doc lands on the listing page.
    url: `/${locale}/materials`,
    title: d.title,
    excerpt: d.description ?? '',
    body: items.map((i) => `${i.title} ${i.description ?? ''}`).join(' '),
    tags: [],
    typeLabel: typeLabelOf('material', locale),
    meta: [],
  };
}

/** The full per-locale corpus, in `SEARCH_TYPES` display order (each group newest-first). */
export async function buildSearchCorpus(locale: Locale): Promise<SearchDoc[]> {
  const [blog, portfolio, events, materials] = await Promise.all([
    getLocalizedEntries('blog', locale),
    getLocalizedEntries('portfolio', locale),
    getLocalizedEntries('events', locale),
    getLocalizedEntries('materials', locale),
  ]);
  const docs: Record<SearchType, SearchDoc[]> = {
    blog: blog.map(({ slug, entry }) => blogDoc(locale, slug, entry)),
    project: portfolio.map(({ slug, entry }) => projectDoc(locale, slug, entry)),
    talk: events.map(({ slug, entry }) => talkDoc(locale, slug, entry)),
    material: materials.map(({ slug, entry }) => materialDoc(locale, slug, entry)),
  };
  return SEARCH_TYPES.flatMap((type) => docs[type]);
}
