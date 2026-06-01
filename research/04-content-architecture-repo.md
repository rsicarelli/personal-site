<!-- Paste the contents of 00-shared-context.md above this line before sending. -->

FOCUS: How to organize the GitHub repo as the source of truth, and model the content.

Research best practices and the range of patterns (2025–2026) for structuring a git-as-CMS repo
for a multi-section bilingual personal site. Cover, without pre-judging a single layout:
- Repo/folder conventions for content collections: blog, CV, portfolio, events, photo galleries,
  downloadable materials, and pages — and how leading SSGs/frameworks expect these to be laid out.
- Bilingual content organization at the file level: parallel pt-BR/EN files vs single-file
  multi-locale vs locale-folders; how to keep translations in sync and avoid missing-locale gaps.
- Content modeling: frontmatter schemas, type-safe content, structured data for CV/portfolio/events
  (so it can also feed SEO structured data and AI consumption).
- Authoring workflow for a single technical owner: edit in IDE vs git-based web editors vs
  lightweight CMS layers that commit to GitHub (e.g. Decap/Netlify CMS, TinaCMS, Keystatic,
  Sveltia, Pages CMS, and others) — including which support bilingual content and media.
- Media/asset strategy: where talk photos and downloadable materials live (in-repo vs Git LFS vs
  external object storage/CDN/image service), and the trade-offs for repo size, build time, cost.
- Versioning, drafts/scheduling, and review workflow (branches/PRs/preview deploys) for content.

Key questions:
- What folder structure scales to hundreds of posts/photos while keeping push-to-deploy simple?
- Best way to guarantee both locales stay complete and discoverable?
- When do in-repo assets become a problem, and what's the migration path to external storage?

Follow the unbiased mandate and output contract from the context block.
