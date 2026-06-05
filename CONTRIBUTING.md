# Contributing & workflow

This is a solo project, but it runs with light, real governance so the work stays organized and the
roadmap stays honest. See the north star in [`CLAUDE.md`](CLAUDE.md) and the research in the private
repo [**rsicarelli/personal-site-private**](https://github.com/rsicarelli/personal-site-private) (`SUMMARY.md`).

## Planning model

- **Roadmap:** the **rsicarelli.com Roadmap** GitHub Project (Projects v2).
- **Hierarchy:** `Epic` (issue labeled `epic`) → **sub-issues** (task issues).
- **Board fields:** **Status** (Todo → In Progress → Done) · **Area** · **Priority** (P0/P1/P2).
- **Phases = Milestones:** `P0 · Foundation & Governance` → `P1 · Core Site` →
  `P2 · Launch-ready` → `P3 · Polish & Content` → `P4 · Monetization (future)`.
- **Labels:** `epic` + `area:*` (foundation, devex, i18n, content, design, seo, infra, analytics,
  security, payments).

## Working a task

1. Pick a high-priority item that's `Todo`; move it to `In Progress`.
2. Branch off `main` (e.g. `feat/i18n-routing`, `chore/ci`). Never commit straight to `main`.
3. Open a PR that says `Closes #<issue>`; fill the PR checklist.
4. Merge when checks pass; the issue closes and the board item moves to `Done`.

## Definition of Done

- Acceptance criteria on the issue are met.
- Both locales (pt-BR + English) handled, or explicitly N/A.
- No accessibility, SEO (hreflang/canonical), or Core Web Vitals regressions.
- `typecheck` + `lint` + `build` pass; no secrets committed.

## Commits & PRs

- Conventional-commit style: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`, `perf:`.
- Small, focused PRs. One concern per PR where possible.

## License

By submitting a contribution you agree that:

- **Code** contributions (anything outside `src/content/`) are licensed under **Apache-2.0**,
  matching the repository's [`LICENSE`](LICENSE) (inbound = outbound; no CLA).
- **Content** (`src/content/**`) is authored by the site owner and is
  **CC BY-NC 4.0** ([`src/content/LICENSE`](src/content/LICENSE)); prose/translation
  contributions, if accepted, are licensed under the same terms.

## Board maintenance (one-time UI follow-ups)

The board's fields, items, and automation seed were created by a one-off bootstrap script
(`scripts/bootstrap-project.sh`, removed after it served its purpose — recover it from git history
if a fork ever needs it). Two things must be set in the GitHub UI (the `gh` CLI can't):

1. **Saved views:** (a) _Board_ grouped by Status; (b) _By Area_ (table) grouped by Area;
   (c) _By Phase_ (table) grouped by Milestone.
2. **Built-in workflows:** enable _Auto-add to project_ (repo issues) and _Item closed → Status: Done_.
