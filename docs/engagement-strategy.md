# Engagement strategy (#191)

The durable decision record for community engagement on `rsicarelli.com` — comments, reactions,
shares, view counts, newsletter, discussion. Synthesized from three engagement deep-research reports
(**tech architecture · engagement strategy · identity, consent & moderation**) in the private repo
**rsicarelli/personal-site-private** (start at `SUMMARY.md`). Read this before building anything under
the **Engagement & Community** epic (#191) so we don't re-litigate it.

> **One line:** optimize for the **relationship** (anonymous lurker → subscriber → correspondent), not
> the **reaction**. Own the audience (email + RSS), route discussion to where developers already are
> (GitHub / HN / Mastodon), and add only the on-page primitives that survive the _"does this help at
> low volume?"_ test — all **cookieless, server-side, no consent banner**.

## Philosophy — the relationship funnel

Engagement is a funnel, and every primitive must move a reader along it rather than serve spectacle:

| Stage             | What it means                        | Primary mechanism                              |
| ----------------- | ------------------------------------ | ---------------------------------------------- |
| **Lurker (90%)**  | reads, never contributes             | fast, cookieless reading; anonymous reactions  |
| **Subscriber**    | opts into a return path we own       | **newsletter + RSS** (the backbone)            |
| **Correspondent** | actually talks to us / the community | reply-via-email, off-site discussion, comments |

The 90-9-1 rule (Nielsen) means ~90% of readers lurk, ~9% contribute occasionally, ~1% do most of the
talking. We design for lurkers first and treat real conversation as the rare, valuable tail — not the
default we pad with vanity numbers.

## Guardrail — resist vanity counters

**Just because the tech makes a counter trivial does not mean we display it.** This is the highest-risk
mistake for a solo blog and is called out explicitly so it isn't "accidentally" built:

- Public view / like / clap / share counters are **mostly vanity** and **backfire at low volume** —
  a visible "0 likes" or "2 views" signals _low value_ (the empty-room problem). 90-9-1 guarantees
  most posts will look empty.
- Social-proof / herding research (Muchnik, Aral & Taylor, _Science_ 2013) shows counters **distort**
  perceived quality rather than measure it; they only help when numbers are already high.
- **Decision:** count views/reactions for **our own analytics**, but keep them **private to the author
  or threshold-gated** (only revealed above a credibility threshold). Default to _not_ painting a
  number on the page. See #200 (views) and #201 (reactions).
- Share **counts** are also dead on the network side (X removed the endpoint in 2015) and would
  require trackers — so we ship share **buttons** with no counts (#194).

## Tiered identity model

Map every feature to the **lowest** tier that works — minimizing both reader friction and our legal
surface. **Never gate reading or reacting behind a login.**

| Tier                  | Identity                             | Features                                            | Consent surface                       |
| --------------------- | ------------------------------------ | --------------------------------------------------- | ------------------------------------- |
| **0 — Anonymous**     | none (salted IP+UA hash, no storage) | view counts, reactions, "was this helpful?"         | none (cookieless)                     |
| **1 — Pseudonymous**  | display name + optional email        | DB-backed comments, replies (deferred — see #204)   | privacy notice only; no banner        |
| **2 — Authenticated** | GitHub (Giscus) / later owned OAuth  | comments tied to a verified identity, gated content | strictly-necessary session; no banner |

- **Now:** comments are **Tier 2 via GitHub (Giscus)** — natural for a developer audience and it
  outsources identity, moderation, and storage to GitHub (#195).
- **Owned auth** (Tier 2, our own OAuth/magic-link) is **out of scope here** — it belongs to the
  Monetization epic (#83) and only matters when paid content lands. Because Tiers 0–1 never required
  accounts, there is **no migration debt**.

## Decided stack

| Concern          | Decision                                                                               | Issue |
| ---------------- | -------------------------------------------------------------------------------------- | ----- |
| **Comments**     | **Giscus** (GitHub Discussions) — no cookies on our domain, per-locale threads, GH mod | #195  |
| **Sharing**      | **Web Share API + static intent links**, no counts, no SDKs                            | #194  |
| **Newsletter**   | owned email list, single-field, **double opt-in**, "reply to this email" (ESP TBD)     | #197  |
| **RSS/Atom**     | already shipped; audit per-locale feeds + autodiscovery                                | #198  |
| **Backend**      | **Cloudflare Pages Functions + D1** (SQLite) — D1, never KV, for counters              | #199  |
| **View counts**  | cookieless, Plausible-style `SHA-256(daily_salt + slug + IP + UA)`, salt rotated 24h   | #200  |
| **Reactions**    | anonymous, optimistic UI, cookieless dedup, threshold-gated display                    | #201  |
| **Abuse / spam** | **Cloudflare Turnstile** (default, cookieless) + edge rate-limit + honeypot            | #202  |
| **IndieWeb**     | webmentions + POSSE backfeed, build-time JSON committed to the repo                    | #203  |
| **Privacy**      | **no consent banner** — set zero non-essential client storage; bilingual policy + LGPD | #193  |

Why these: D1's free tier (100k row writes/day) dwarfs KV's (1k writes/day) and avoids last-write-wins
races on counters; Giscus and Turnstile set **no cookies on our domain**, so neither triggers a banner;
keeping all state server-side and cookieless is the only design that is universally banner-free across
GDPR/ePrivacy **and** Brazil's LGPD. Full rationale, free-tier limits, and the comment-system scoring
matrix live in the three private-repo reports.

## Inherited constraints (from `CLAUDE.md`)

These project rules bind engagement work and are restated so they aren't forgotten:

- **No hard redirect by IP/locale** (301/302). Detect locale only at `/`; keep a visible switcher.
  Googlebot crawls from US IPs without `Accept-Language` and would miss non-English pages — engagement
  widgets must never introduce a locale redirect.
- **Per-locale engagement.** Every primitive is split per locale: EN and pt-BR posts get **separate**
  comment threads, syndication targets, and counts. A single shared bilingual thread reads half-empty
  and half-foreign and depresses participation in both languages.
- **Bilingual is mandatory.** Every reader-facing string lives in `src/i18n/ui.ts` (both locales); the
  CI i18n-completeness guardrail must stay green.
- **Performance + privacy are features.** Zero-JS by default; lazy-load every third-party widget below
  the fold; reserve layout boxes (no CLS); no tracking pixels. This aligns with the existing cookieless
  analytics posture (`docs/analytics.md`).

## What we are deliberately NOT doing

- Public vanity counters at low volume (see guardrail above).
- Login-gated reading or reacting.
- A single shared bilingual comment thread.
- Owned auth / paid-content gating — deferred to Monetization (#83).
- Heavy gamification (teams, points, leaderboards).
- DB-backed anonymous comments **now** — deferred (#204), built only if Giscus's GitHub-account wall
  measurably suppresses engagement.

## Backlog

The epic **#191** tracks the ordered backlog (#192–#204) with priorities and dependencies. Build order
favors highest-ROI / lowest-regret first: privacy foundation (#193) and share buttons (#194) →
Giscus comments (#195) → newsletter + RSS (#197/#198) → backend (#199) → views/reactions/safety
(#200/#201/#202) → IndieWeb (#203). The owned-comments fallback (#204) stays in the icebox.
