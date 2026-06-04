// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { rehypeR2Images } from './src/lib/rehype-r2-images.mjs';
import { placeholderBlogPaths } from './scripts/placeholder-posts.mjs';
import { blogLastmod } from './scripts/blog-lastmod.mjs';

// `translated: false` placeholder posts (#152) are `robots: noindex, follow`. Drop them from the
// sitemap too (#173): a noindexed URL in the sitemap only earns a benign "Submitted URL marked
// 'noindex'" notice in Search Console. Computed once from the same scan that drives the noindex
// meta, so a post rejoins the sitemap automatically when it's translated (#143) — no per-post edit.
const noindexPlaceholders = await placeholderBlogPaths();

// Real per-post <lastmod> (#231 E1): updatedDate ?? pubDate, so the sitemap carries a true freshness
// signal instead of @astrojs/sitemap's all-equal build-time default. Keyed by site-root path.
const blogDates = await blogLastmod();

// https://astro.build/config
export default defineConfig({
  // Static output (Astro's default with no `output` key and no adapter): the build emits a fully
  // prebuilt `dist/` that Cloudflare Pages serves directly — zero-JS by default, no server runtime.
  // Deploy is Pages' native Git integration (push to `main` → build → deploy; PR previews); the
  // build command + output dir live in the Cloudflare Pages dashboard build config. (We do NOT ship a
  // wrangler config file: with one present, the Pages build BETA ignores the dashboard environment
  // variables — which silently disabled the env-gated Umami + Giscus integrations, see #195.)

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
      // The callback only sees the absolute URL string; match on its trailing-slash-normalized
      // pathname (dir-form <loc>s carry a trailing slash, the placeholder set doesn't).
      filter: (page) => !noindexPlaceholders.has(new URL(page).pathname.replace(/\/$/, '')),
      // Stamp blog posts with their real lastmod (#231 E1); other URLs keep the integration default.
      serialize(item) {
        const date = blogDates.get(new URL(item.url).pathname.replace(/\/$/, ''));
        if (date) item.lastmod = date;
        return item;
      },
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

  // Remote image hosts allowed for optimization / direct embedding. Blog posts mirrored from
  // dev.to keep their cover + inline image URLs on dev.to's CDN until media is moved to R2 (#R2);
  // these patterns let `coverUrl`/body images render without erroring. Drop them after the R2 move.
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media2.dev.to' },
      { protocol: 'https', hostname: 'dev-to-uploads.s3.amazonaws.com' },
    ],
  },

  // Blog reading time (#31): a remark plugin computes `minutesRead` from each post's prose and
  // exposes it on `render()`'s remarkPluginFrontmatter. MDX inherits the markdown remark plugins
  // by default, so blog .mdx posts get it too.
  markdown: {
    remarkPlugins: [remarkReadingTime],
    // Rewrite R2-hosted blog `<img>`s (media.rsicarelli.com) to responsive Cloudflare edge-transform
    // markup with baked dimensions (#186). Inherited by MDX via the integration's extendMarkdownConfig.
    rehypePlugins: [rehypeR2Images],
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
      // Giscus comments (#195) — GitHub Discussions backend, cookieless, env-gated like Umami above.
      // All four are required to activate; when any is unset (dev/local/CI) the Comments component
      // emits nothing. Values come from giscus.app after enabling Discussions + installing the app.
      PUBLIC_GISCUS_REPO: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GISCUS_REPO_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_GISCUS_CATEGORY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_GISCUS_CATEGORY_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      // Newsletter (#197) — gates the footer signup form. Set to 'true' once the server-side
      // BUTTONDOWN_API_KEY secret is configured (dashboard). The secret itself is NOT astro:env —
      // it's read by the /api/subscribe Pages Function via context.env. See docs/newsletter.md.
      PUBLIC_NEWSLETTER_ENABLED: envField.string({
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

  // Self-hosted variable fonts (#43). Astro's Fonts API downloads the woff2 at build via the
  // Google provider and serves them from our own origin (NO runtime font CDN), generating the
  // @font-face rules, fallback-metric overrides (cuts CLS), and the preload links emitted by the
  // <Font> component in BaseLayout. Inter is the editorial body face; JetBrains Mono is the
  // "monospace accent" (brand, nav labels, code). Both subset to Latin + Latin-Extended so the
  // full pt-BR diacritics (ã õ á é ç …) render. `weights` are variable-font ranges (one file
  // each), `display: swap` avoids invisible text. Wired to --font-sans / --font-mono in global.css.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['100 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      display: 'swap',
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      // Source Serif 4 (#226) — the editorial reading layer for long-form (`.prose`). Variable
      // transitional serif with an optical-size axis (`font-optical-sizing: auto`), OFL, full pt-BR
      // diacritics in latin + latin-ext. Self-hosted via the Fonts API (no runtime font CDN); the
      // article body + post titles use it, while Inter stays the UI face and JetBrains Mono the code face.
      provider: fontProviders.google(),
      name: 'Source Serif 4',
      cssVariable: '--font-source-serif',
      weights: ['200 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      display: 'swap',
      fallbacks: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
    },
  ],

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
