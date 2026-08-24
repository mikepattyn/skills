# Agent Skills shelf

This folder is the **platform skill shelf**: the Agent Skills this workshop actually uses, versioned in the repo so they apply in Cursor and so anyone reading the source can see the pick.

Cursor discovers project skills from `.cursor/skills/` (and nested app shelves). Official reference: [Agent Skills](https://cursor.com/docs/skills). The open standard: [agentskills.io](https://agentskills.io).

Why a short shelf that you review beats a pile of installs is taught on the portfolio: [Under the hood — Pick the skills](https://mikepattyn.nl/#agent-skills).

## On this shelf

| Skill | When it applies |
| ----- | --------------- |
| [tdd](tdd/) | Features and bugs test-first; tests at public seams |
| [teach](teach/) | A multi-session teaching workspace (mission, lessons, records) |
| [umbrella-teach](umbrella-teach/) | A summarized chat → public Under the Hood topic for learning programmers |
| [grill-me](grill-me/) | Stress-test a plan, one decision at a time |
| [grill-with-docs](grill-with-docs/) | Same grilling, against `CONTEXT.md` and ADRs |
| [page-accessibility](page-accessibility/) | WCAG work on a real page and its children |
| [frontend-page-accessibility](frontend-page-accessibility/) | Same skill, across every frontend app (auto-discovers deploy workflows plus Canvas / Ondernemingsplan, diffs last-run commits on the current branch, parallel worktrees; ≤40) |
| [frontend-format](frontend-format/) / [frontend-lint](frontend-lint/) | Format or lint every frontend (one worktree agent per app per step, from the current branch; ≤40) |
| [backend-format](backend-format/) / [backend-lint](backend-lint/) | Format or lint backends from `deploy-*-backend.yml` under `apps/` |
| [platform-format](platform-format/) / [platform-lint](platform-lint/) | Format or lint CDK, Email, themes, db-explorer, e2e, scripts, Authress gitlinks |
| [platform-quality](platform-quality/) | User-invoked umbrella only: page-accessibility → scripts-to-node → lint → format on the current branch |
| [scripts-to-node](scripts-to-node/) | Convert native `.sh`/`.ps1` to Node; shells remain wrappers that start the `.mjs`; tests run Node (one worktree agent per stem, from the current branch; ≤40) |
| [cloudflare](cloudflare/) | Cloudflare platform work; retrieve current docs, don't guess |
| [research](research/) | Investigate against primary sources; write the note in-repo |
| [research-summarizer](research-summarizer/) | Structured briefs, comparisons, and citations |

Also written for this platform (same folder):

| Skill | When it applies |
| ----- | --------------- |
| [responsive-frontend](responsive-frontend/) | Any visual change under `apps/` — mobile, tablet, desktop |
| [scaffold-vanilla-frontend](scaffold-vanilla-frontend/) | New vanilla static frontend + portfolio entry |
| [add-frontend-deploy-workflow](add-frontend-deploy-workflow/) | Root GitHub Action that publishes a frontend to S3/CloudFront |
| [drawio-aws-architecture](drawio-aws-architecture/) | Draw.io AWS architecture diagrams for this platform |
| [migrate-vanilla-to-angular](migrate-vanilla-to-angular/) | Evidence-first move from vanilla HTML/JS to Angular 22 |
| [privacy-by-design](privacy-by-design/) | Privacy section plus TTL on tracking data, never on commercial records |
| [app-fanout](app-fanout/) | Shared planner assets for the orchestrators above — not a user-facing skill |

## App shelves

Nested `.cursor/skills/` folders stay with the app they belong to. Cursor scopes those to that subtree.

| App | Skills |
| --- | ------ |
| [Kapsalon](../../apps/kapsalon/.cursor/skills/) | `kapsalon-domain`, `page-accessibility` (app-scoped copy) |

## Review habit

Install is cheap. Attention is not. Keep skills that match how this workshop works; drop or replace the ones that don't. Re-read this list when the stack or the way of working changes.
