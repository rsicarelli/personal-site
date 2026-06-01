#!/usr/bin/env bash
# Bootstrap the "rsicarelli.com Roadmap" GitHub Project (v2): labels, milestones,
# project + fields, and the full epic -> task backlog (tasks linked as native sub-issues),
# all added to the board with Area + Priority set.
#
# Idempotent: re-running reuses existing labels/milestones/project/fields/issues by name/title,
# so it's safe to run again if GitHub secondary rate limits interrupt a run.
#
# Requires: gh (authed, `project` scope), jq.
set -uo pipefail

REPO="rsicarelli/personal-site"
OWNER="@me"
PROJECT_TITLE="rsicarelli.com Roadmap"

# ---------------------------------------------------------------- labels
echo "==> labels"
gh label create epic --repo "$REPO" --color 6F42C1 --description "Large body of work, broken into sub-issues" --force >/dev/null
for pair in foundation:0E8A16 devex:1D76DB i18n:5319E7 content:0052CC design:D93F0B \
            seo:FBCA04 infra:006B75 analytics:C2E0C6 security:B60205 payments:BFD4F2; do
  a=${pair%%:*}; c=${pair##*:}
  gh label create "area:$a" --repo "$REPO" --color "$c" --description "Area: $a" --force >/dev/null
done

# ---------------------------------------------------------------- milestones
echo "==> milestones"
gh api "repos/$REPO/milestones?state=all&per_page=100" > /tmp/ms.json
ensure_milestone(){
  local t="$1" num
  num=$(jq -r --arg t "$t" '.[] | select(.title==$t) | .number' /tmp/ms.json | head -1)
  if [ -z "$num" ] || [ "$num" = "null" ]; then
    gh api "repos/$REPO/milestones" -f title="$t" >/dev/null
  fi
}
ensure_milestone "P0 · Foundation & Governance"
ensure_milestone "P1 · Core Site"
ensure_milestone "P2 · Launch-ready"
ensure_milestone "P3 · Polish & Content"
ensure_milestone "P4 · Monetization (future)"
gh api "repos/$REPO/milestones?state=all&per_page=100" > /tmp/ms.json
ms_num(){ jq -r --arg t "$1" '.[] | select(.title==$t) | .number' /tmp/ms.json | head -1; }

# ---------------------------------------------------------------- project + fields
echo "==> project"
PROJECT_NUMBER=$(gh project list --owner "$OWNER" --format json | jq -r --arg t "$PROJECT_TITLE" '.projects[] | select(.title==$t) | .number' | head -1)
if [ -z "$PROJECT_NUMBER" ] || [ "$PROJECT_NUMBER" = "null" ]; then
  PROJECT_NUMBER=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json | jq -r .number)
fi
gh project link "$PROJECT_NUMBER" --owner "$OWNER" --repo "$REPO" >/dev/null 2>&1 || true
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r .id)
echo "    project #$PROJECT_NUMBER ($PROJECT_ID)"

ensure_field(){
  local name="$1" opts="$2"
  if ! gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -e --arg n "$name" '.fields[] | select(.name==$n)' >/dev/null; then
    gh project field-create "$PROJECT_NUMBER" --owner "$OWNER" --name "$name" --data-type SINGLE_SELECT --single-select-options "$opts" >/dev/null
  fi
}
ensure_field "Area" "Foundation,DevEx,i18n,Content,Design,SEO,Infra,Analytics,Security,Payments"
ensure_field "Priority" "P0,P1,P2"
gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json > /tmp/fields.json

# ---------------------------------------------------------------- issue helpers
echo "==> snapshotting existing issues"
gh issue list --repo "$REPO" --state all --limit 800 --json number,title,id > /tmp/existing.json
: > /tmp/fieldmap   # num|Area|Priority

RET_NUM=""; RET_NODE=""
ensure_issue(){ # title, body, milestone_title, label...
  local title="$1" body="$2" ms="$3"; shift 3
  local fnum fid
  fnum=$(jq -r --arg t "$title" '.[] | select(.title==$t) | .number' /tmp/existing.json | head -1)
  if [ -n "$fnum" ] && [ "$fnum" != "null" ]; then
    RET_NUM=$fnum
    RET_NODE=$(jq -r --arg t "$title" '.[] | select(.title==$t) | .id' /tmp/existing.json | head -1)
    return 0
  fi
  local args=(--method POST "repos/$REPO/issues" -f "title=$title" -f "body=$body")
  local msnum; msnum=$(ms_num "$ms")
  [ -n "$msnum" ] && [ "$msnum" != "null" ] && args+=(-F "milestone=$msnum")
  local l; for l in "$@"; do args+=(-f "labels[]=$l"); done
  local resp; resp=$(gh api "${args[@]}")
  RET_NUM=$(echo "$resp" | jq -r .number)
  RET_NODE=$(echo "$resp" | jq -r .node_id)
}

add_to_board(){ gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "https://github.com/$REPO/issues/$1" >/dev/null 2>&1 || true; }
link_sub(){ gh api graphql -H "GraphQL-Features: sub_issues" -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){subIssue{number}}}' -f p="$1" -f c="$2" >/dev/null 2>&1 || true; }

CUR_AREA=""; CUR_MS=""; CUR_PRIO=""; CUR_EPIC_NODE=""; CUR_EPIC_NUM=""; CUR_EPIC_TITLE=""
epic(){ # title, area, milestone, priority, body
  local title="$1" area="$2" ms="$3" prio="$4" body="$5"
  local lbl="area:$(echo "$area" | tr '[:upper:]' '[:lower:]')"
  ensure_issue "$title" "$body" "$ms" "epic" "$lbl"
  CUR_AREA="$area"; CUR_MS="$ms"; CUR_PRIO="$prio"
  CUR_EPIC_NODE="$RET_NODE"; CUR_EPIC_NUM="$RET_NUM"; CUR_EPIC_TITLE="$title"
  add_to_board "$RET_NUM"
  echo "$RET_NUM|$area|$prio" >> /tmp/fieldmap
  echo "  EPIC #$RET_NUM  $title"
}
task(){ # title  [priority-override]
  local title="$1" prio="${2:-$CUR_PRIO}"
  local lbl="area:$(echo "$CUR_AREA" | tr '[:upper:]' '[:lower:]')"
  local body="Part of #$CUR_EPIC_NUM — **$CUR_EPIC_TITLE**.

See \`research/SUMMARY.md\` for rationale."
  ensure_issue "$title" "$body" "$CUR_MS" "$lbl"
  link_sub "$CUR_EPIC_NODE" "$RET_NODE"
  add_to_board "$RET_NUM"
  echo "$RET_NUM|$CUR_AREA|$prio" >> /tmp/fieldmap
  echo "    task #$RET_NUM  $title"
}

# ================================================================ BACKLOG
echo "==> creating epics + tasks"

epic "[Epic] Project Foundation & Tooling" "Foundation" "P0 · Foundation & Governance" "P0" \
"Stand up the Astro app and the baseline tooling everything else builds on."
task "Scaffold Astro (TypeScript strict, pnpm)"
task "Add Tailwind CSS v4"
task "Add component layer (shadcn/ui on Radix/Base UI)"
task "Configure formatter + linter (Prettier + ESLint or Biome)"
task "Pin Node version + package manager (.nvmrc / packageManager)"
task "Base layout shell + design-token skeleton"
task "Content collections + Zod schemas skeleton (blog, portfolio, events, cv, pages)"
task "Add .env.example + runtime config conventions"

epic "[Epic] Governance & DevEx" "DevEx" "P0 · Foundation & Governance" "P0" \
"Repo process, CI, and protections so changes stay safe and consistent."
task "Label taxonomy (epic + area:*)"
task "Issue templates (epic/task/bug) + PR template"
task "CONTRIBUTING.md + Definition of Done"
task "CI workflow: install -> typecheck -> lint -> build on PR"
task "Branch protection on main + required status checks"
task "Dependabot config"
task "Project automation (auto-add issues, close -> Done)"
task "Conventional commits / commitlint" "P2"

epic "[Epic] Internationalization (i18n)" "i18n" "P1 · Core Site" "P0" \
"Fully bilingual pt-BR/EN with browser-locale defaulting and no SEO traps."
task "Astro i18n config: en + pt-br, subdirectory routing (/en/, /pt-br/)"
task "Browser-locale detection at / only (no hard redirect) + x-default gateway"
task "Language switcher (preserves current path)"
task "Reciprocal hreflang (en/pt-br/x-default) on every page"
task "Locale-completeness guardrail: Zod requires both locales + CI slug-diff check"
task "Locale-aware sitemap"
task "UI string dictionary (nav/labels/buttons) per locale"

epic "[Epic] Content Architecture & Pages" "Content" "P1 · Core Site" "P0" \
"The repo-as-CMS content model and the core pages of the site."
task "Implement src/content/{blog,portfolio,events,cv,pages} structure"
task "Home hub (latest posts, featured talk, OSS cards, upcoming events)"
task "About/CV page (semantic Person data) + print stylesheet + PDF export"
task "Blog: index + post template (MDX, tags, reading time)"
task "RSS feed (per locale)"
task "Projects/OSS page (cards for fakt, kmp-targets, kmp-native-flavors)"
task "Talks/Events page (upcoming + past, KotlinConf facade video, slides)"
task "Contact page (email + socials)"
task "Photos gallery (talk photos, served from R2)"
task "Materials/Downloads page (served from R2)"
task "404 page (bilingual)"
task "Uses / Now pages" "P2"

epic "[Epic] Design System & Visual Identity" "Design" "P1 · Core Site" "P1" \
"Minimalist-editorial identity, accessible and performance-aware."
task "Color tokens in Oklch (deep-slate base + accent) + semantic tokens"
task "Dark/light mode (system + persisted toggle)"
task "Self-host variable fonts (Inter/IBM Plex Sans + mono), subset Latin+Latin-Extended"
task "Core components (nav, footer, cards, buttons, prose)"
task "Responsive layout + container system"
task "Accessibility baseline WCAG 2.2 AA (focus, target size, contrast)"
task "Image pipeline (AVIF/WebP, explicit dims, lazy, LQIP/BlurHash)"
task "lite-youtube facade for talk videos"
task "Motion (View Transitions + prefers-reduced-motion)"

epic "[Epic] SEO & GEO/AEO" "SEO" "P2 · Launch-ready" "P1" \
"Rank on Google and be discoverable/citable by AI engines."
task "Metadata system (per-locale titles/descriptions, canonical, OG + Twitter)"
task "JSON-LD from Zod (Person, BlogPosting, BreadcrumbList, Event, SoftwareSourceCode, CreativeWork)"
task "robots.txt: allow AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended) + Googlebot"
task "Sitemaps -> submit to Google Search Console + Bing; enable IndexNow"
task "llms.txt (auto-generated)"
task "Answer-first content template (capsule + headings + FAQ)"
task "hreflang CI validation (reciprocity + ISO codes)"
task "Core Web Vitals budget + monitoring (Lighthouse CI / PageSpeed)"
task "E-E-A-T wiring (/about sameAs: GitHub, LinkedIn, X, KotlinConf, Stone; bylines; dateModified)"

epic "[Epic] Hosting, Deploy & DNS" "Infra" "P2 · Launch-ready" "P0" \
"Cloudflare Pages auto-deploy, DNS for rsicarelli.com, email, and R2 media."
task "Create Cloudflare Pages project, connect GitHub repo (auto-deploy main)"
task "Build config (Astro adapter/output/env)"
task "PR preview deploys"
task "Move DNS to Cloudflare (nameserver delegation)"
task "Point rsicarelli.com apex (CNAME flatten) + www -> Pages; Universal SSL"
task "Email: Cloudflare Email Routing (hello@) + outbound (Zoho/Gmail send-as) + SPF/DKIM/DMARC"
task "Create R2 bucket for media/downloads; wire into build/runtime"
task "_redirects / custom 404 config"
task "Deploy runbook doc"

epic "[Epic] Analytics & Metrics" "Analytics" "P2 · Launch-ready" "P2" \
"Privacy-first, cookieless analytics with no cookie banner."
task "Integrate Umami (Cloud free tier or self-host), cookieless"
task "Add Cloudflare Web Analytics (free baseline)"
task "Define key events (downloads, outbound clicks, talk-video plays)"
task "Confirm no cookie banner needed (LGPD/GDPR) + privacy note"
task "PostHog for conversion funnels (future)" "P2"

epic "[Epic] Security & Hardening" "Security" "P2 · Launch-ready" "P1" \
"Headers, dependency hygiene, secret safety, and crawler access."
task "Security headers via Cloudflare _headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)"
task "Dependency review + Dependabot alerts"
task "Secret hygiene (.env.example, secret scanning on, no secrets in repo)"
task "Verify Cloudflare WAF does not block legit AI/search crawlers"
task "CodeQL workflow" "P2"
task "Minimal third-party / SRI review" "P2"

epic "[Epic] Monetization (future)" "Payments" "P4 · Monetization (future)" "P2" \
"Forward-compatible path to selling exclusive paid content. Deferred."
task "Decide platform: MoR (Paddle=Pix / Polar / Lemon Squeezy) vs Brazilian (Hotmart/Kiwify/Mercado Pago) vs Stripe"
task "Decide tax structure: pessoa fisica (carne-leao) vs MEI/CNPJ"
task "Reserve /courses route + gated-content architecture (Astro Server Islands + auth)"
task "Choose course delivery (self-built vs hosted)"
task "Integrate payments + entitlement/gating"
task "Conversion analytics (PostHog)"

# ---------------------------------------------------------------- field values
echo "==> setting Area + Priority on board items"
gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 800 --format json > /tmp/items.json
set_field(){ # item_id, field_name, option_name
  local fid oid
  fid=$(jq -r --arg n "$2" '.fields[] | select(.name==$n) | .id' /tmp/fields.json)
  oid=$(jq -r --arg n "$2" --arg o "$3" '.fields[] | select(.name==$n) | .options[] | select(.name==$o) | .id' /tmp/fields.json)
  [ -z "$fid" ] || [ -z "$oid" ] && return 0
  gh project item-edit --id "$1" --project-id "$PROJECT_ID" --field-id "$fid" --single-select-option-id "$oid" >/dev/null 2>&1 || true
}
while IFS='|' read -r num area prio; do
  [ -z "$num" ] && continue
  itemid=$(jq -r --argjson n "$num" '.items[] | select(.content.number==$n) | .id' /tmp/items.json | head -1)
  [ -z "$itemid" ] || [ "$itemid" = "null" ] && continue
  set_field "$itemid" "Area" "$area"
  set_field "$itemid" "Priority" "$prio"
done < /tmp/fieldmap

echo "==> done. Project #$PROJECT_NUMBER"
