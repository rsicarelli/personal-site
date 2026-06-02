// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Final deployed URL — used for canonical URLs and the sitemap.
  site: 'https://rsicarelli.com',

  // React powers interactive shadcn/ui components as islands only — the site stays
  // zero-JS by default; islands hydrate per-component via client:* directives.
  // MDX backs the content collections (blog/portfolio/events/pages).
  // Sitemap (#25) is locale-aware: the `i18n` option emits per-URL <xhtml:link hreflang>
  // alternates mirroring the in-page tags. Map key = URL slug (`pt-br`), value = hreflang
  // code (`pt-BR`) — same lowercase-slug / uppercase-region split as the rest of the site.
  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'pt-br': 'pt-BR' },
      },
    }),
  ],

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

  // i18n routing (#20). Subdirectory URLs /en/ + /pt-br/ (never ccTLD/subdomain/?lang=).
  // `prefixDefaultLocale: true` prefixes English too, so `/` is a neutral, crawlable gateway.
  // `redirectToDefaultLocale: false` keeps `/` from issuing a hard 301 to /en/ — Googlebot
  // crawls from US IPs with no Accept-Language and must reach both languages. Browser-locale
  // detection happens client-side at `/` only (see src/pages/index.astro), never server-side.
  i18n: {
    locales: ['en', 'pt-br'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  // Keep generated URLs (routes, hreflang, sitemap) in agreement on trailing slashes.
  trailingSlash: 'ignore',
});
