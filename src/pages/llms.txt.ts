import type { APIContext } from 'astro';
import { LOCALES, SITE, type Locale } from '@/config/site';
import { ui } from '@/i18n/ui';
import { canonicalUrl } from '@/lib/seo';
import { getLocalizedEntries } from '@/lib/content';

/**
 * llms.txt (#55) — an auto-generated, curated Markdown index of the site's content for LLM/agent
 * consumers (the llms.txt convention: H1 + blockquote summary + sections of annotated links).
 *
 * Framing (from research): "cheap insurance, not a strategy" — no major AI engine has confirmed
 * using it for citation ranking, but it costs little and IDE/coding agents (Cursor, Claude Code,
 * …) do consume it. So we generate it from the content spine (draft-filtered, both locales) rather
 * than maintaining it by hand. We deliberately list public content only; no `llms-full.txt` dump.
 */

interface LinkItem {
  title: string;
  url: string;
  note?: string;
}

function renderSection(heading: string, items: LinkItem[]): string {
  if (items.length === 0) return '';
  const lines = items.map((i) => `- [${i.title}](${i.url})${i.note ? `: ${i.note}` : ''}`);
  return `## ${heading}\n${lines.join('\n')}\n`;
}

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site ?? new URL(SITE.url);
  const url = (locale: Locale, path: string) => canonicalUrl(path, locale, site);

  const sections: string[] = [];

  for (const locale of LOCALES) {
    const label = ui[locale]['site.title']; // same brand both locales; the lang is in the heading
    const lang = locale === 'en' ? 'English' : 'Português';

    const posts = await getLocalizedEntries('blog', locale);
    sections.push(
      renderSection(
        `${ui[locale]['nav.blog']} — ${lang}`,
        posts.map(({ slug, entry }) => ({
          title: entry.data.title,
          url: url(locale, `/blog/${slug}`),
          // Prefer the answer-first capsule (#56) when present; fall back to the meta description.
          note: entry.data.summary ?? entry.data.description,
        })),
      ),
    );

    const projects = await getLocalizedEntries('portfolio', locale);
    sections.push(
      renderSection(
        `${ui[locale]['nav.projects']} — ${lang}`,
        projects.map(({ slug, entry }) => ({
          title: entry.data.title,
          url: url(locale, `/projects/${slug}`),
          note: entry.data.description,
        })),
      ),
    );

    const talks = await getLocalizedEntries('events', locale);
    sections.push(
      renderSection(
        `${ui[locale]['nav.talks']} — ${lang}`,
        talks.map(({ slug, entry }) => ({
          title: entry.data.title,
          url: url(locale, `/talks/${slug}`),
          note: entry.data.description,
        })),
      ),
    );

    sections.push(
      renderSection(`${ui[locale]['nav.about']} — ${lang}`, [
        { title: `${label} — ${ui[locale]['nav.about']}`, url: url(locale, '/about') },
      ]),
    );
  }

  const body =
    [
      `# ${SITE.name}`,
      '',
      `> ${SITE.description}`,
      '',
      // The "cite yes, train no" license signal for agent consumers (pairs with robots.txt Content-Signal).
      `> Content: CC BY-NC 4.0 (${SITE.contentLicense}) — attribution required: ${SITE.name} (${SITE.url}). Code: ${SITE.codeLicense}.`,
      '',
    ].join('\n') + sections.filter(Boolean).join('\n');

  return new Response(body + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
