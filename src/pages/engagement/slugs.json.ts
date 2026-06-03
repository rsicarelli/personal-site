import { localizedPaths } from '@/lib/content';

/**
 * Build-time allowlist manifest (#200) — the set of valid blog post paths, served at
 * `/engagement/slugs.json`. The `/api/view` Pages Function fetches it (cached) and rejects any path
 * that isn't a real published post, so the `counters` table can't be polluted with fake slugs.
 * Non-locale global endpoint (same shape as `src/pages/llms.txt.ts`).
 */
export async function GET(): Promise<Response> {
  const entries = await localizedPaths('blog');
  const paths = entries.map(({ params }) => `/${params.locale}/blog/${params.slug}`).sort();
  return new Response(JSON.stringify({ paths }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
