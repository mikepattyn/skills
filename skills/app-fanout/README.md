# App fan-out (shared)

Shared engine and child-agent assets for the platform orchestrators:

- `frontend-format` / `frontend-lint` / `frontend-page-accessibility`
- `backend-format` / `backend-lint`
- `platform-format` / `platform-lint`
- `scripts-to-node` (script stems, not app trees)
- `platform-quality` (umbrella; user-invoked only)

Planning and last-run recording live in [`scripts/app-fanout.mjs`](../../scripts/app-fanout.mjs) and [`scripts/app-fanout.config.json`](../../scripts/app-fanout.config.json). Each atomic skill has its own `SKILL.md`, `agent-prompt.md`, and `last-runs.json`. The executing parent commits that `last-runs.json` when `record` adds an id or changes `recordedAt` / `lastCommit` — children never touch the file.

Children close the worktree they were placed in with `node scripts/app-fanout.mjs close --here` before they return (branch kept for merge). The parent always runs `close --skill <id> <tree>` after merge or failure so leftovers do not stay open, and `close --skill <id> --base-worktree` if it created `.worktrees/<baseBranch>` for merges.

Plans and records against the **current local branch** (or `--base`). Every plan row includes `baseBranch` so children branch from and merge back into that branch. Agents call the script directly (`node scripts/app-fanout.mjs plan --skill <id>`). There are no Makefile plan/record targets.

This folder is **not** a user-facing skill. Do not trigger it. Do not invoke `platform-quality` from here.

## Add an atomic workflow

1. Add a key under `skills` in `scripts/app-fanout.config.json`: `cohort`, `discover` (`deploy-frontend-content`, `deploy-backend`, `trees`, or `script-stems`), `lastRunsPath`, `steps` (one step), and `incompleteField` (`pages`, `files`, or `null`). For `trees`, include the path list. Frontend skills may add `extraTrees` (Canvas, Ondernemingsplan). Mark gitlinks `{ "gitlink": true }`. `script-stems` discovers tracked `.sh`/`.ps1` families via [`scripts/script-stems.mjs`](../../scripts/script-stems.mjs).
2. Add `.cursor/skills/<id>/` with `SKILL.md`, `agent-prompt.md`, and `last-runs.json`.
3. If it belongs in the umbrella, add it to the matching `platform-quality` wave.
4. List the skill in `AGENTS.md` and the shelf README.

`node scripts/app-fanout.mjs list` prints registered skills. `maxLaunch` is **40**. Each child does **one** step so context stays small.

`node scripts/app-fanout.mjs plan --skill platform-quality --wave 0` unions that wave and slices one shared 40 cap. Umbrella waves: **0** page-accessibility, **1** convert (`scripts-to-node`), **2** lint, **3** format. Each nested skill diffs last recorded commit → current tip and skips `no-diff`.

## Gitlink clones

Do not edit files in the umbrella gitlink checkout. Plan JSON includes `url`, `pinnedSha` (the SHA the current `baseBranch` records), and `cloneDir` under `.worktrees/gitlinks/<id>`. Child clones that SHA, commits in the clone; parent bumps only the gitlink pointer on `baseBranch`.

Enrolled: Authress Flutter/Angular (platform), Canvas and Ondernemingsplan (frontend). Out: Mapbox, Flyingdarts.

## Assets for isolated trees

Children copy these only when the tree has **no** formatter or linter yet. Do **not** replace Staying Grounded, kapsalon `.prettierrc`, or Flutter `analysis_options.yaml`.

| File | Use |
| ---- | --- |
| [assets/.prettierrc](assets/.prettierrc) | JS/TS/HTML/CSS (printWidth 100, singleQuote true) |
| [assets/eslint.config.js](assets/eslint.config.js) | Vanilla JS/TS ESLint + Prettier |
| [templates/format-agent-prompt.md](templates/format-agent-prompt.md) | Format-only child prompt |
| [templates/lint-agent-prompt.md](templates/lint-agent-prompt.md) | Lint-only child prompt |
| [templates/gitlink-agent-prompt.md](templates/gitlink-agent-prompt.md) | Gitlink clone child prompt |
