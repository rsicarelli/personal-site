<!-- Paste the contents of 00-shared-context.md above this line before sending. -->

FOCUS: Where to host, how auto-deploy works, DNS wiring, email, and total cost.

Survey the full 2025–2026 landscape of hosting/deploy platforms that auto-build-and-deploy from a
GitHub repo, including but not limited to: Cloudflare Pages/Workers, Vercel, Netlify, GitHub Pages,
Render, Deno Deploy, Fly.io, Static hosting on object storage + CDN, and self-hosted options.

For each viable platform, detail:
- The git-push → build → deploy pipeline (native git integration vs GitHub Actions), preview
  deploys for branches/PRs, build minutes/bandwidth limits.
- Free tier limits and the exact paid pricing (USD + approximate BRL) once exceeded; bandwidth
  egress costs for an image/material-heavy site.
- Performance & global delivery (CDN/edge POPs, especially latency to Brazil/LATAM).
- Custom domain + TLS setup, and concretely how to point the already-owned rsicarelli.com
  (apex + www) at the platform (DNS records, registrar transfer vs delegation, Cloudflare as DNS).
- Email for the domain (e.g. hello@rsicarelli.com): free/cheap options for sending & receiving,
  forwarding services, and deliverability (SPF/DKIM/DMARC).
- Scaling cost: what happens to the bill as traffic and stored assets grow; cost of adding a
  dynamic backend later (for payments).
- Lock-in and exit cost per platform.

Key questions:
- What's the cheapest robust setup that meets all firm constraints (likely $0–small/month)?
- Which platforms best handle large image galleries and file downloads without surprise egress bills?
- Recommended DNS topology for rsicarelli.com that keeps options open.

Follow the unbiased mandate and output contract from the context block.
