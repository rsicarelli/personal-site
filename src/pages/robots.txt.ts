import type { APIContext } from 'astro';
import { SITE } from '@/config/site';

/**
 * robots.txt (#53) — generated so the `Sitemap:` line tracks the configured origin (no hardcoded
 * host). Posture: **cite yes, train no.** AI search/answer/user-action crawlers are welcome — they
 * cite their sources, and for a personal brand visibility in AI answers is the win. Training-only
 * crawlers are disallowed: training never attributes, and the content license (CC BY-NC 4.0, see
 * src/content/LICENSE) requires attribution. The `Content-Signal` directive (Cloudflare's Content
 * Signals Policy) declares the same split machine-readably for crawlers that honor it. Deprecated
 * agent strings (`Claude-Web`, `anthropic-ai`) are intentionally omitted — Anthropic dropped them.
 *
 * NOTE: signals and robots rules are preferences, not enforcement — the license is the legal layer,
 * this file is the machine-readable declaration of it.
 */

/** Search/answer/user-action crawlers — these cite/link the source, so they stay allowed. */
const ALLOW_BOTS = [
  'Googlebot', // classic Search + AI Overviews — never block
  'OAI-SearchBot', // ChatGPT search indexing
  'ChatGPT-User', // ChatGPT user-initiated fetches
  'Claude-User', // Claude user-initiated retrieval
  'Claude-SearchBot', // Claude search indexing
  'PerplexityBot', // Perplexity indexing (answers cite sources)
];

/** Training-only crawlers — model training never attributes, so they are disallowed. */
const DISALLOW_TRAINING_BOTS = [
  'GPTBot', // OpenAI training
  'Google-Extended', // Gemini/Vertex grounding+training — no way to split, so it goes with training
  'ClaudeBot', // Anthropic training
];

export function GET(context: APIContext): Response {
  const origin = context.site ?? new URL(SITE.url);
  const sitemap = new URL('/sitemap-index.xml', origin).href;

  const body = [
    '# rsicarelli.com — cite yes, train no (see /LICENSE + src/content/LICENSE).',
    '#',
    '# Content Signals Policy (https://contentsignals.org). The Content-Signal directive',
    '# expresses how this site permits automated use of its content ("yes" = permitted):',
    '#   search:   build a search index and show links/snippets',
    '#   ai-input: use content as input to AI answers (RAG/grounding) — citation welcome',
    '#   ai-train: train or fine-tune AI models — not permitted',
    '# These signals are a usage preference, not a substitute for the license: content is',
    `# CC BY-NC 4.0 (${SITE.contentLicense}) — attribution required.`,
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    '',
    ...ALLOW_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    ...DISALLOW_TRAINING_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Disallow: /', '']),
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
