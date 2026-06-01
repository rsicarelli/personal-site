<!-- Paste the contents of 00-shared-context.md above this line before sending. -->

FOCUS: The web technology and architecture for the site.

Survey the full 2025–2026 landscape of approaches for a content-heavy, bilingual personal site
that auto-deploys from a GitHub repo. Cover, without pre-judging:
- Static site generators (e.g. Astro, Hugo, Eleventy, Zola, and others worth knowing).
- Full-stack / hybrid frameworks (e.g. Next.js, SvelteKit, Nuxt, Remix, and others) in their
  static/SSG and hybrid modes.
- Rendering strategies: SSG vs SSR vs ISR vs edge rendering vs islands/partial hydration — and
  which fits a fast, SEO/GEO-friendly, mostly-content site.
- The "content layer": Markdown/MDX, content collections, type-safe content, frontmatter, and how
  each framework models structured content (blog posts, CV data, portfolio items, events, photo
  galleries, downloadable materials).
- Bilingual (pt-BR/EN) IMPLEMENTATION at the framework level: routing strategies (path prefix vs
  subdomain vs domain), browser-locale detection/defaulting, per-locale content, and how painful
  i18n is in each option.
- Authoring ergonomics for a single technical owner editing in Git (DX, build speed, hot reload).
- Long-term maintainability, ecosystem momentum, hiring-free solo maintenance, and lock-in.

Key questions to answer:
- Which approaches make "push to GitHub = live bilingual site" cleanest?
- What are realistic build times and scaling limits as content grows (hundreds of posts/photos)?
- Where do image-heavy galleries (talk photos) and downloadable materials fit best?
- What's the minimum complexity that still satisfies all firm constraints?

Follow the unbiased mandate and output contract from the context block.
