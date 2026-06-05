import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from '../i18n/_helpers';

/**
 * robots.txt (#53). Asserts the built `dist/robots.txt` implements the "cite yes, train no"
 * posture: search/answer/user-action crawlers allowed, training-only crawlers disallowed, the
 * Content-Signal directive declared on `User-agent: *`, and the sitemap advertised on the
 * configured origin. The deprecated agent strings must stay out.
 */

/** Search/answer/user-action crawlers — cite their sources, stay allowed. */
const ALLOWED_BOTS = [
  'Googlebot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
];

/** Training-only crawlers — never attribute, disallowed. */
const TRAINING_BOTS = ['GPTBot', 'Google-Extended', 'ClaudeBot'];

/** Extract the directive lines of a single `User-agent: <bot>` block. */
function blockOf(txt: string, bot: string): string {
  const match = txt.match(new RegExp(`User-agent: ${bot}\\n((?:[^\\n]+\\n)*?)(?:\\n|$)`));
  return match?.[1] ?? '';
}

describe('robots.txt', () => {
  let txt: string;
  beforeAll(async () => {
    txt = await readFile(join(DIST, 'robots.txt'), 'utf8');
  });

  it('allows all crawlers by default and declares the Content-Signal split', () => {
    const wildcard = blockOf(txt, '\\*');
    expect(wildcard).toContain('Allow: /');
    expect(wildcard).not.toContain('Disallow: /');
    expect(wildcard).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=no');
  });

  it('explicitly allows every search/answer bot', () => {
    for (const bot of ALLOWED_BOTS) {
      expect(blockOf(txt, bot), `User-agent: ${bot} should be allowed`).toContain('Allow: /');
    }
  });

  it('disallows every training-only bot', () => {
    for (const bot of TRAINING_BOTS) {
      expect(blockOf(txt, bot), `User-agent: ${bot} should be disallowed`).toContain('Disallow: /');
    }
  });

  it('omits the deprecated Anthropic agent strings', () => {
    expect(txt).not.toContain('Claude-Web');
    expect(txt).not.toContain('anthropic-ai');
  });

  it('advertises the sitemap on the canonical origin', () => {
    expect(txt).toContain('Sitemap: https://rsicarelli.com/sitemap-index.xml');
  });
});
