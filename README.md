# Skills

This repo is the **platform skill shelf**: the Agent Skills the workshop actually uses, versioned so Cursor can load them and so you can see the pick.

Cursor discovers project skills from `.cursor/skills/` (and nested app shelves). Official reference: [Agent Skills](https://cursor.com/docs/skills). The open standard: [agentskills.io](https://agentskills.io). Why a short shelf that you review beats a pile of installs: [Under the hood — Pick the skills](https://mikepattyn.nl/#agent-skills).

| Path | What it is |
| ---- | ---------- |
| [`skills/`](skills/README.md) | The shelf — one folder per skill |
| [`scripts/app-fanout.mjs`](scripts/app-fanout.mjs) | Shared planner the orchestrators call |
| [`scripts/app-fanout.config.json`](scripts/app-fanout.config.json) | Which skills exist, how they discover trees, wave order |
| [`.github/workflows/`](.github/workflows/) | Deploy workflow copies so discovery has YAML to scan |
| [`platform-quality-fanout.tsx`](platform-quality-fanout.tsx) | Visual of `/platform-quality` (ordinary React; drop into any tree) |

The rest of this README is the engine. Per-skill rules live in each `SKILL.md`.

## App fan-out

[`skills/app-fanout/`](skills/app-fanout/) is **not** a user-facing skill. Do not trigger it. It is the shared planner, last-run recorder, worktree closer, and child-agent assets for every one-step orchestrator:

- `frontend-page-accessibility` / `frontend-lint` / `frontend-format`
- `backend-lint` / `backend-format`
- `platform-lint` / `platform-format`
- `scripts-to-node` (script stems, not app trees)
- `platform-quality` (umbrella; user-invoked only — never start it from another orchestrator)

Agents call the script directly. There are no Makefile plan/record targets.

```
node scripts/app-fanout.mjs list
node scripts/app-fanout.mjs plan --skill <id> [--force] [--app <id> ...] [--wave <n>] [--base <branch>]
node scripts/app-fanout.mjs record --skill <id> [--commit <sha>] [--base <branch>]
  [--incomplete-pages <csv>] [--incomplete-files <csv>] <id> [<id> ...]
node scripts/app-fanout.mjs close --here
node scripts/app-fanout.mjs close --skill <id> [--base-worktree] [--base <branch>] <id> [<id> ...]
```

`maxLaunch` is **40**. Each child does **one** step so context stays small. Plans and records against the **current local branch** (or `--base`). Every plan row includes `baseBranch` so children branch from that branch and merge back into it. The parent never pushes.

In the workshop monorepo, last-run files live at `lastRunsPath` in config (`.cursor/skills/<id>/last-runs.json`). This repo *is* that shelf, under [`skills/`](skills/).

### The loop

1. **Plan** — discover enrolled trees for that skill, diff each from its last recorded commit to the current tip, emit `launchNow` (dirty), skip (`no-diff` / `already-node` / missing), and `deferred` (over the 40 cap). Empty `launchNow` means skip the skill or wave.
2. **Fan out** — one child agent per `launchNow` row, in an isolated git worktree. The parent checkout **never** `git checkout`s a child branch and **never** `git reset --hard`.
3. **Merge** — owned trees: merge `worktreeBranch` into `baseBranch`. Gitlinks: bump only the pointer to the clone’s new SHA.
4. **Close** — children run `close --here` before they return (branch kept). The parent always runs `close --skill <id> <tree>` after merge or failure so leftovers do not stay open, and `close --skill <id> --base-worktree` if it created a base-branch worktree for merges.
5. **Record** — write that nested skill’s `last-runs.json` and Conventional-Commit **only** that file when an id is new or `recordedAt` / `lastCommit` changed. Children never touch the file. Failures are not recorded. Do not `record --skill platform-quality`.

### How trees are discovered

| `discover` | Who | Source |
| ---------- | --- | ------ |
| `deploy-frontend-content` | frontend skills | Root `deploy-<id>-frontend.yml` or `deploy-<id>-content.yml` with an `apps/` path filter, plus `extraTrees` (canvas, ondernemings-plan gitlinks) |
| `deploy-backend` | backend skills | Root `deploy-<id>-backend.yml` with an `apps/` path filter |
| `trees` | platform skills | Explicit list in config (CDK, Email, themes, db-explorer, e2e, scripts, Authress gitlinks) |
| `script-stems` | `scripts-to-node` | Tracked `.sh` / `.ps1` families via [`scripts/script-stems.mjs`](scripts/script-stems.mjs) |

A backend workflow with no `apps/` path is skipped (`deploy-dashboard-backend.yml` is the example; that lambda lives in the platform CDK tree). Mapbox and Flyingdarts stay out.

Gitlink rows clone `pinnedSha` into `.worktrees/gitlinks/<id>`. The child commits in the clone. The parent only bumps the gitlink pointer on `baseBranch`. Do not edit files in the umbrella gitlink checkout.

### `/platform-quality`

User-invoked umbrella only. It does not audit, convert, lint, or format a tree itself. It plans **one wave**, fans out (shared 40 cap across nested skills), merges, closes, records each nested skill, then re-plans the next wave so diffs see the new tip.

| Wave | Step | Nested skills | Why this order |
| ---: | ---- | ------------- | -------------- |
| 0 | page-accessibility | `frontend-page-accessibility` | Audit markup first, while it is still the markup you wrote |
| 1 | convert | `scripts-to-node` | New `.mjs` files must exist before later waves can lint and format them. Shells stay wrappers |
| 2 | lint | `frontend-lint`, `backend-lint`, `platform-lint` | After convert, and never in the same launch as format |
| 3 | format | `frontend-format`, `backend-format`, `platform-format` | Last, so lint is not rewriting what format just cleaned |

Same-tree lint and format must not run in parallel. Shared files race if every child edits the same `package.json`.

```
node scripts/app-fanout.mjs plan --skill platform-quality --wave 0
```

[`platform-quality-fanout.tsx`](platform-quality-fanout.tsx) is a clickable diagram of that loop. [`skills/platform-quality/SKILL.md`](skills/platform-quality/SKILL.md) is the contract.

### Add an atomic workflow

1. Add a key under `skills` in [`scripts/app-fanout.config.json`](scripts/app-fanout.config.json): `cohort`, `discover`, `lastRunsPath`, `steps` (one step), `incompleteField` (`pages`, `files`, or `null`). For `trees`, include the path list. Frontend skills may add `extraTrees`. Mark gitlinks `{ "gitlink": true }`.
2. Add the skill folder with `SKILL.md`, `agent-prompt.md`, and `last-runs.json`.
3. If it belongs in the umbrella, add it to the matching `platform-quality` wave.
4. List it on [`skills/README.md`](skills/README.md).

Child-agent assets (copy only when a tree has **no** formatter or linter yet — do not replace Staying Grounded, kapsalon `.prettierrc`, or Flutter `analysis_options.yaml`) live under [`skills/app-fanout/`](skills/app-fanout/README.md).

## On this shelf

Fan-out orchestrators (use the engine above):

| Skill | When it applies |
| ----- | --------------- |
| [frontend-page-accessibility](skills/frontend-page-accessibility/) | WCAG across every frontend (workflows + Canvas / Ondernemingsplan) |
| [frontend-format](skills/frontend-format/) / [frontend-lint](skills/frontend-lint/) | Format or lint every frontend, one worktree agent per app |
| [backend-format](skills/backend-format/) / [backend-lint](skills/backend-lint/) | Format or lint backends from `deploy-*-backend.yml` under `apps/` |
| [platform-format](skills/platform-format/) / [platform-lint](skills/platform-lint/) | Format or lint CDK, Email, themes, db-explorer, e2e, scripts, Authress gitlinks |
| [scripts-to-node](skills/scripts-to-node/) | Convert native `.sh` / `.ps1` to Node; shells remain wrappers; tests run Node |
| [platform-quality](skills/platform-quality/) | User-invoked umbrella: accessibility → convert → lint → format |
| [app-fanout](skills/app-fanout/) | Shared planner assets — not a user-facing skill |

Everything else on the shelf (no fan-out):

| Skill | When it applies |
| ----- | --------------- |
| [tdd](skills/tdd/) | Features and bugs test-first; tests at public seams |
| [teach](skills/teach/) | A multi-session teaching workspace |
| [umbrella-teach](skills/umbrella-teach/) | A summarized chat → public Under the Hood topic |
| [grill-me](skills/grill-me/) | Stress-test a plan, one decision at a time |
| [grill-with-docs](skills/grill-with-docs/) | Same grilling, against `CONTEXT.md` and ADRs |
| [page-accessibility](skills/page-accessibility/) | WCAG work on a real page and its children |
| [cloudflare](skills/cloudflare/) | Cloudflare platform work; retrieve current docs |
| [research](skills/research/) | Investigate against primary sources; write the note in-repo |
| [research-summarizer](skills/research-summarizer/) | Structured briefs, comparisons, and citations |
| [responsive-frontend](skills/responsive-frontend/) | Any visual change under `apps/` |
| [scaffold-vanilla-frontend](skills/scaffold-vanilla-frontend/) | New vanilla static frontend + portfolio entry |
| [add-frontend-deploy-workflow](skills/add-frontend-deploy-workflow/) | Root GitHub Action that publishes a frontend to S3/CloudFront |
| [drawio-aws-architecture](skills/drawio-aws-architecture/) | Draw.io AWS architecture diagrams |
| [migrate-vanilla-to-angular](skills/migrate-vanilla-to-angular/) | Evidence-first move from vanilla HTML/JS to Angular 22 |
| [privacy-by-design](skills/privacy-by-design/) | Privacy section plus TTL on tracking data, never on commercial records |

Install is cheap. Attention is not. Keep skills that match how this workshop works.
