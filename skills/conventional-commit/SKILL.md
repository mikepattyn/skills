---
name: conventional-commit
description: >-
  Create a Conventional Commits git commit from the files this chat changed.
  Use when the user asks to commit, mentions /conventional-commit, or wants a
  conventional commit message. The file list always comes from this conversation
  — never the whole working tree.
---

# Conventional Commit

Commit the work from **this chat**, not everything dirty in the repo.

The working tree often has leftover files from other conversations. Starting
from `git status` scoops that unrelated work into the commit. The file list
comes from this conversation first; git only confirms those paths still have
uncommitted changes.

## 1. Collect this chat's paths

From **this conversation only**, list every path that was created, edited, or
deleted:

- Files you wrote, patched, or removed in this chat
- Files the user asked to change that you then changed
- Paths implied by a rename or move you performed here

Do not invent files from `git status`. Do not search other chats. If this
conversation has no recorded file edits, stop and say so — do not fall back
to committing the rest of the working tree. Ask the user to name the files,
or to run this skill from the chat that made the changes.

If the user explicitly names extra paths in the same message, include those
too.

## 2. Confirm against git

Run these in parallel:

- `git status` — see what is actually uncommitted
- `git diff` and `git diff --cached` — only for the chat paths
- `git log -5 --oneline` — match this repo's message style

Keep the **intersection**: chat paths that still have uncommitted changes.
Skip chat paths with no diff (reverted or already committed). Leave every
other dirty file unstaged and mention them so the user knows they were
excluded.

Never stage secrets (`.env`, `credentials.json`, private keys).

## 3. Write the message from that diff only

Use Conventional Commits. Infer type and scope from the chat-scoped diff,
not from unrelated dirty files.

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

| Type | Use when |
| ---- | -------- |
| `feat` | New capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no behavior change |
| `refactor` | Restructure, no feature or fix |
| `perf` | Performance |
| `test` | Tests only |
| `build` | Build system or dependencies |
| `ci` | CI config |
| `chore` | Maintenance |
| `revert` | Revert a previous commit |

- Description is imperative and present tense (`add`, not `added`)
- Scope is optional; use it when the area is obvious (`auth`, `cdk`, `skills`)
- Body explains why, not a file list
- Breaking change: `feat!: …` and/or a `BREAKING CHANGE:` footer

Examples: `feat(parser): add array support`, `fix(ui): correct button alignment`,
`docs: update README with usage instructions`.

## 4. Stage only the intersection and commit

Stage the intersection paths explicitly (`git add -- path1 path2`). Do not
`git add .` or `git add -A`.

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

optional body
EOF
)"
```

Safety: never update git config, never skip hooks, never amend unless the
user asked and the amend rules in the user commit protocol all hold, never
push unless asked.

If the commit fails a hook, fix the issue and create a **new** commit.

## 5. Report

Tell the user what landed in the commit and which dirty files were left
unstaged because they were not part of this chat.
