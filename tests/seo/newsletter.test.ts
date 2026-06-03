import { describe, it, expect } from 'vitest';
import { collectLocalePages } from '../i18n/_helpers';

/**
 * Newsletter (#197) — gating/privacy: with PUBLIC_NEWSLETTER_ENABLED unset (the default build / CI),
 * the footer signup form must NOT be emitted anywhere (env-gated, like Giscus).
 */
describe('newsletter form is gated off by default', () => {
  it('ships no signup form when PUBLIC_NEWSLETTER_ENABLED is unset', async () => {
    const pages = await collectLocalePages();
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) {
      // Form-only markers (the always-emitted enhancement script references the selector by
      // property, not these literals), so their absence proves the form itself isn't rendered.
      expect(p.html, `${p.relPath} unexpectedly renders the signup form`).not.toContain(
        'action="/api/subscribe"',
      );
      expect(p.html, `${p.relPath} unexpectedly renders the email field`).not.toContain(
        'id="newsletter-email"',
      );
    }
  });
});
