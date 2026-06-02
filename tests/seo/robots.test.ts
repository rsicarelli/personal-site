import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST } from '../i18n/_helpers';

/**
 * robots.txt (#53). Asserts the built `dist/robots.txt` welcomes Googlebot + every AI search/
 * training crawler the research calls out, allows all by default, and advertises the sitemap on the
 * configured origin. The deprecated agent strings must stay out.
 */

const REQUIRED_BOTS = [
  'Googlebot',
  'Google-Extended',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
];

describe('robots.txt', () => {
  let txt: string;
  beforeAll(async () => {
    txt = await readFile(join(DIST, 'robots.txt'), 'utf8');
  });

  it('allows all crawlers by default', () => {
    expect(txt).toMatch(/User-agent:\s*\*/);
    expect(txt).toMatch(/Allow:\s*\//);
    expect(txt).not.toMatch(/^\s*Disallow:\s*\/\s*$/m);
  });

  it('explicitly welcomes every required AI/search bot', () => {
    for (const bot of REQUIRED_BOTS) {
      expect(txt, `missing User-agent: ${bot}`).toContain(`User-agent: ${bot}`);
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
