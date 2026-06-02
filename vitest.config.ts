import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Plain Vitest (no `getViteConfig`): the i18n tests assert on built `dist/**` HTML and pure
// helpers — they never render `.astro`, so we avoid loading the full Astro/Tailwind/MDX pipeline.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `astro:env/client` is a virtual module that only exists during an Astro build; src/config/
      // site.ts reads PUBLIC_SITE_URL from it. Stub it so the helper import chain resolves here.
      'astro:env/client': fileURLToPath(
        new URL('./tests/__mocks__/astro-env-client.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
