import type { APIContext } from 'astro';
import { LOCALES } from '@/config/site';
import { useTranslations } from '@/i18n/utils';
import type { UIKey } from '@/i18n/ui';
import { getLocalizedEntries } from '@/lib/content';
import { renderOgCard } from '@/lib/og';

/**
 * Per-page OpenGraph card images (#148): `/og/<locale>/<collection>/<slug>.png`, prerendered at
 * build. Generated ONLY for content detail entries that have no self-hosted `cover` (so each blog
 * post / project / talk without an image gets a branded title card instead of the generic
 * `og-default.png`). The card is on the rsicarelli.com origin, which the metadata suite requires.
 * Detail pages reference this URL as their OG/JSON-LD image fallback (a local `cover`, when present,
 * still wins).
 */
const COLLECTIONS = [
  { key: 'blog', label: 'nav.blog' },
  { key: 'portfolio', label: 'nav.projects' },
  { key: 'events', label: 'nav.talks' },
] as const satisfies readonly { key: 'blog' | 'portfolio' | 'events'; label: UIKey }[];

export const prerender = true;

export async function getStaticPaths() {
  const paths: {
    params: { locale: string; collection: string; slug: string };
    props: { title: string; eyebrow: string; seed: string };
  }[] = [];
  for (const { key, label } of COLLECTIONS) {
    for (const locale of LOCALES) {
      const t = useTranslations(locale);
      for (const { slug, entry } of await getLocalizedEntries(key, locale)) {
        // A self-hosted cover already gives a real OG image — skip the generated card.
        if ((entry.data as { cover?: unknown }).cover) continue;
        paths.push({
          params: { locale, collection: key, slug },
          props: { title: entry.data.title, eyebrow: t(label), seed: slug },
        });
      }
    }
  }
  return paths;
}

export async function GET({ props }: APIContext): Promise<Response> {
  const { title, eyebrow, seed } = props as { title: string; eyebrow: string; seed: string };
  const png = await renderOgCard({ title, eyebrow, seed });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
