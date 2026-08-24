# Child agent prompt (scripts-to-node)

Parent fills every `{{…}}` field from `node scripts/app-fanout.mjs plan --skill scripts-to-node` JSON. Send this as the full Task prompt. The child has no parent chat history.

If `scriptFiles.sh` or `scriptFiles.ps1` is null, put `(missing — create wrapper)` in that placeholder.

```
You are the scripts-to-node agent for one script stem in the mikepattyn Platform repo.

Skill: scripts-to-node
Stem id: {{ID}}
Stem: {{STEM}}
Directory: {{DIR}}
Agent name / branch: {{WORKTREE_BRANCH}}
Base branch: {{BASE_BRANCH}}
Baseline ({{BASE_BRANCH}} SHA): {{HEAD}}
Last recorded commit: {{LAST_COMMIT}}
Why this run: {{REASON}}
Shell (unix): {{SH}}
Shell (PowerShell): {{PS1}}
Node target: {{MJS}}
Files on this stem:
{{CHANGED_FILES}}

## Setup

1. Reset this worktree onto `{{BASE_BRANCH}}` (from the parent plan) and name the branch before any edits:
   `git reset --hard {{BASE_BRANCH}}`
   `git checkout -B {{WORKTREE_BRANCH}}`
   Do not run git in the parent checkout.
2. Edit only this stem: `{{MJS}}`, `{{STEM}}.test.mjs`, the `.sh` and `.ps1` for `{{STEM}}`, and a GitHub **test** workflow that already invoked this stem. Do not convert other stems. Do not edit `.cursor/skills/scripts-to-node/last-runs.json`.
3. Read `CONTEXT-MAP.md`, then a nearby `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill. Do not format other trees. Do not lint the platform.
5. Do not push. Never amend. Never skip hooks.
6. If this run **succeeds**, create one Conventional Commits commit of only this stem's files. Skip the commit if you made no file changes.

## Convert

Read `.cursor/skills/scripts-to-node/references/convert.md` and follow it.

1. Read the native `.sh` and `.ps1` (whichever exist). Port equivalent behavior into `{{MJS}}` (ESM). Export `main(argv)`.
2. Replace both shells with the generic wrappers (copy, do not paraphrase):
   - `.cursor/skills/scripts-to-node/templates/wrapper.sh`
   - `.cursor/skills/scripts-to-node/templates/wrapper.ps1`
   If a twin is missing, create it. Wrappers must only start `node {{MJS}}`.
3. Write `{{STEM}}.test.mjs` using `node:test`. Tests must exercise the `.mjs` (import `main` or spawn `process.execPath` on `{{MJS}}`). Do not use bash or pwsh as the test runner.
4. Run `node --test {{STEM}}.test.mjs` until it passes. If a GitHub test job ran this stem with `bash`/`pwsh`, switch that job to `node {{MJS}}` and add the `.mjs` to its path filter.
5. The run fails if the `.mjs` is missing, if either shell still contains native logic, or if tests did not run against Node.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only this stem's files (and the one test-workflow you had to change). Never `git add -A`. Never stage last-runs.json.
3. Message like `refactor({{ID}}): run this script from node and keep shells as wrappers`.

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

- Worktree branch (`{{WORKTREE_BRANCH}}`)
- Whether the stem succeeded (yes/no)
- Files written, `node --test` result
- Whether wrappers are template copies
- Commit hash and message (empty if none)
```
