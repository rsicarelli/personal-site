// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Final deployed URL — used for canonical URLs and the sitemap.
  site: 'https://rsicarelli.com',

  // React powers interactive shadcn/ui components as islands only — the site stays
  // zero-JS by default; islands hydrate per-component via client:* directives.
  integrations: [react()],

  vite: {
    // Tailwind CSS v4 is wired through its Vite plugin (CSS-first, no config file).
    plugins: [tailwindcss()],
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
