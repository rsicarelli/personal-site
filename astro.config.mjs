// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Final deployed URL — used for canonical URLs and the sitemap.
  site: 'https://rsicarelli.com',

  // React powers interactive shadcn/ui components as islands only — the site stays
  // zero-JS by default; islands hydrate per-component via client:* directives.
  // MDX backs the content collections (blog/portfolio/events/pages).
  integrations: [react(), mdx()],

  vite: {
    // Tailwind CSS v4 is wired through its Vite plugin (CSS-first, no config file).
    plugins: [tailwindcss()],
  },

  // Typed runtime configuration (astro:env). Import these from `astro:env/client` (or
  // `astro:env/server` for secrets) instead of reading import.meta.env directly, so missing
  // or malformed values fail the build. Real values live in an untracked .env — see
  // .env.example. Analytics keys are placeholders wired up in the Analytics epic (#71).
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'https://rsicarelli.com',
      }),
      PUBLIC_UMAMI_SRC: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_UMAMI_WEBSITE_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },

  // i18n routing is owned by the dedicated i18n epic (#19). The layout and content
  // schemas already leave room for it; enabling it here is intentionally deferred.
  // Planned shape — subdirectory URLs /en/ + /pt-br/, browser-locale detect at `/` only,
  // never a hard IP/locale redirect:
  //
  // i18n: {
  //   locales: ['en', 'pt-br'],
  //   defaultLocale: 'en',
  //   routing: { prefixDefaultLocale: true },
  // },
});
