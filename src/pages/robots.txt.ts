import type { APIContext } from 'astro';
import { SITE } from '@/config/site';

/**
 * robots.txt (#53) — generated so the `Sitemap:` line tracks the configured origin (no hardcoded
 * host). Posture: allow everything, and explicitly welcome the major AI search/retrieval/training
 * crawlers. For a personal brand, visibility in AI answers is the win; the research found the real
 * risk is accidentally *blocking* (often at the CDN/WAF, not here). Deprecated agent strings
 * (`Claude-Web`, `anthropic-ai`) are intentionally omitted — Anthropic dropped them.
 *
 * NOTE: a blanket `User-agent: *  Allow: /` already permits every bot, so the per-bot blocks below
 * are declarative documentation of intent (and a guard against a future tightening of `*`).
 */
const AI_AND_SEARCH_BOTS = [
  'Googlebot', // classic Search + AI Overviews — never block
  'Google-Extended', // Gemini/Vertex grounding+training (not a Search ranking signal)
  'GPTBot', // OpenAI training
  'OAI-SearchBot', // ChatGPT search indexing
  'ChatGPT-User', // ChatGPT user-initiated fetches
  'ClaudeBot', // Anthropic training
  'Claude-User', // Claude user-initiated retrieval
  'Claude-SearchBot', // Claude search indexing
  'PerplexityBot', // Perplexity indexing
];

export function GET(context: APIContext): Response {
  const origin = context.site ?? new URL(SITE.url);
  const sitemap = new URL('/sitemap-index.xml', origin).href;

  const body = [
    '# rsicarelli.com — allow all crawlers, explicitly welcome AI search/training bots (#53).',
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_AND_SEARCH_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
