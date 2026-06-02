---
name: pr
description: >-
  Open a pull request for the current branch in this repo. Verifies a feature branch, runs the DOD
  gate, fills the repo's PR template, writes a Conventional-Commit title, links the issue
  (`Closes #n`), and creates the PR via gh. Use when the user asks to "open a PR", "create PR",
  "abrir PR", "push and open a PR". NOT for writing commit messages (use the `commit` skill).
license: MIT
metadata:
  authors: Rodrigo Sicarelli
  version: "1.0.0"
---

# Pull Request

Single source of truth for opening PRs in `rsicarelli/personal-site` (one repo — no multi-project
detection). Follows `CONTRIBUTING.md`.

## 1. Pre-flight

```bash
git branch --show-current
git status --short
```

- **Never open a PR from `main`.** If on `main`, stop and ask for a feature branch.
- Branch names: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `ci/`, `perf/`, `test/` + a short
  kebab slug (e.g. `feat/i18n-routing`).
- Ensure work is committed (use the `commit` skill) and the **DOD gate is green** before pushing:

```bash
mise exec -- task dod   # format + typecheck + lint + build
```

## 2. Move the board item to In Progress

When starting a task, set its GitHub Project (#3) Status to **In Progress** if not already (per
`CONTRIBUTING.md`). Re-derive item IDs with `gh project item-list 3 --owner rsicarelli`.

## 3. Analyze the full change set

```bash
git log --oneline main..HEAD
git diff --stat main..HEAD
```

Read **all** commits on the branch, not just the latest — the PR description covers the whole set.

## 4. Read and fill the PR template

Read `.github/pull_request_template.md` with the **Read tool** (never write the body from memory).
Then:

- Fill the **Summary** with what changed and why; reference the research repo or an issue if
  relevant.
- Set `Closes #<n>` to the issue this PR resolves.
- Work through the **checklist**, checking what applies and marking `— N/A` where it doesn't (this
  is an infra/content repo; bilingual / hreflang / a11y / CWV items are often N/A for tooling PRs).
- Preserve any HTML comments in the template.
- Write the description in **English** (this repo's template and audience are English).

## 5. Title (Conventional Commit)

- English, **bare prefix** (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`…) — no scope in the title.
- ≤70 chars, imperative, no trailing period. Since PRs merge via **squash**, the title becomes the
  commit on `main`, so make it a clean Conventional Commit.

## 6. Push and create

```bash
git push -u origin "$(git branch --show-current)"
gh pr create --base main --title "<title>" --body "$(cat <<'EOF'
<filled template>
EOF
)"
```

`main` requires the **`CI Summary`** status check (branch protection). After creating, watch it:

```bash
gh run watch "$(gh run list --branch "$(git branch --show-current)" --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

Merge only when green: `gh pr merge <n> --squash --delete-branch` (or `--admin` to override when
appropriate). On merge, set the issue's board item Status to **Done**.

## Rules

1. Always read the actual template — never invent the body.
2. Never push to `main`; always a feature branch.
3. Title is a bare-prefix Conventional Commit, ≤70 chars.
4. Body in English; fill every section, leave no placeholder text.
5. No AI promotional footers in the title or body (`Co-Authored-By` belongs on commits — see the
   `commit` skill).
6. Wait for `CI Summary` green before merging.

## Checklist

- [ ] On a feature branch (not `main`), conventional branch name
- [ ] DOD gate green locally (`task dod`)
- [ ] Board item moved to In Progress
- [ ] PR template read and every section filled (English); HTML comments preserved
- [ ] `Closes #<n>` present
- [ ] Title: bare-prefix Conventional Commit, ≤70 chars
- [ ] Branch pushed with `-u`; PR created via `gh pr create`
- [ ] `CI Summary` watched to green before merge; board item → Done on merge

Related: `commit` (commit messages + required trailer).
