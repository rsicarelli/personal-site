// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';

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

  // Blog reading time (#31): a remark plugin computes `minutesRead` from each post's prose and
  // exposes it on `render()`'s remarkPluginFrontmatter. MDX inherits the markdown remark plugins
  // by default, so blog .mdx posts get it too.
  markdown: {
    remarkPlugins: [remarkReadingTime],
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
      // Base URL for photos/downloads (#36/#37). Defaults to the local `public/media/` dir so dev
      // works with placeholder assets; flips to the Cloudflare R2 public base in the Hosting epic
      // (#67) via .env — no code change. Media itself never lives in git (we avoid Git LFS).
      PUBLIC_MEDIA_BASE_URL: envField.string({
        context: 'client',
        access: 'public',
        default: '/media',
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
