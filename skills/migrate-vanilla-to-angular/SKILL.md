---
name: migrate-vanilla-to-angular
description: Inspect existing Vanilla HTML, CSS, and JavaScript frontends and plan, implement, or review their migration into production-grade Angular 22 applications. Use for repository discovery, leftover vanilla scans after a port, leftover-cleanup after an observation gate, Cursor planning sessions, incremental strangler migrations, Angular workspace and application architecture, route and component boundaries, signals and RxJS state design, testing, accessibility, security, performance, deployment compatibility, or modernization of multiple small web apps.
---

# Migrate Vanilla Apps to Angular 22

Modernize from repository evidence. Preserve behavior, URLs, appearance, data contracts, analytics, and deployment behavior unless the user explicitly approves changes.

## Choose a mode

- **Plan:** inspect the repository and return the required planning deliverable. Do not modify application code.
- **Implement:** require an approved plan or define one small vertical slice first. Change and verify one independently deployable slice at a time. The last A-milestone is leftover-cleanup after the observation gate.
- **Review:** compare an existing migration against the quality gates, run the leftover scan, and report evidence-backed gaps. Do not call the app migrated while `unmigrated-feature` or unfixed `leftover-behavior` remains.
- **Create a Cursor prompt:** adapt [cursor-planning-prompt.md](references/cursor-planning-prompt.md) to known repository facts. Retain its discovery, evidence, leftover-scan, and stop conditions.

## Establish facts and constraints

Confirm from the repository or label as unknown:

- Angular target and exact compatible Node, TypeScript, and RxJS versions.
- Package manager, CI commands, hosting, CDN, base paths, rewrites, redirects, cache rules, environment configuration, and rollback mechanism.
- Whether current apps are separate deployment units, subpath apps, embedded widgets, or pages in one site.
- Required browsers, authentication, SEO, analytics, observability, localization, offline/PWA behavior, and accessibility conformance.
- Whether visual redesign, backend changes, and dependency replacement are in or out of scope.

Use the latest stable Angular 22 patch compatible with the project. Never copy assumptions from an older Angular major. In Angular 22, standalone components, zoneless change detection, and OnPush behavior are defaults; do not add redundant decorator/configuration noise.

If repository access is unavailable, say so. Provide a conditional planning prompt and the exact inventory the next agent must collect. Never invent paths, apps, frameworks, or deployment facts.

## Inspect the repository

Start broad, then inspect representative flows. Prefer `rg --files` and targeted `rg`; ignore dependencies, generated output, coverage, and compiled assets.

For each app, capture evidence for:

1. HTML and JavaScript entry points.
2. URL, hash, query-string, deep-link, and in-page navigation behavior.
3. DOM queries, mutations, event listeners, timers, observers, globals, and lifecycle assumptions.
4. State ownership, derived state, caching, and cross-tab or cross-page communication.
5. HTTP, WebSocket, worker, external SDK, authentication, and error-handling behavior.
6. Storage, cookies, IndexedDB, schemas, and backwards-compatibility requirements.
7. CSS architecture, tokens, fonts, assets, responsive behavior, animations, and browser quirks.
8. Shared utilities and duplicated behavior across apps.
9. Build commands, outputs, public paths, configuration, hosting, redirects, headers, CI, and deployment.
10. Tests, linting, type checks, analytics, error reporting, SEO, performance measurement, and accessibility.
11. Security issues: browser secrets, unsafe HTML, unsanitized URLs, unvalidated inputs, weak auth assumptions, or over-trusted external data.

Produce an inventory table containing app/path, purpose, entry points, navigation, APIs/SDKs, persistence, shared candidates, complexity, risk, deployment unit, and recommended order.

Trace at least one representative flow per app:

`user event -> validation -> state/data operation -> rendered result -> persistence/analytics side effects`

Distinguish every finding as **verified**, **inferred**, **recommended**, or **unknown**. Cite repository paths and symbols for important current-state claims.

## Scan leftovers (required)

After the first inventory, scan each app tree for leftover vanilla. Ignore `node_modules`, `dist`, `.angular`, and coverage.

Search for:

- Root `*.html` with `script src="js/`
- `js/**/*.js` beside an Angular `src/`
- Duplicate `css/` vs `src/styles.css`
- `innerHTML`, `querySelector`, and `addEventListener` in `src/` (review; do not auto-fail)

Classify every hit:

| Class | Meaning | Allowed action |
| ----- | ------- | -------------- |
| `unmigrated-feature` | Behavior still only in vanilla and still shipped | Port before calling the app migrated |
| `rollback-copy` | Parallel vanilla kept for observation-gate rollback | Record owner, gate, and deletion list. Do not start a new framework migration. |
| `leftover-behavior` | Vanilla behavior the Angular port missed | Fix in `src/` or defer with an explicit owner |
| `vanilla-style-angular` | Imperative DOM in `src/` | Keep only if it is a recorded adapter (document theme, iframe host, sanitizer, entry marker). Otherwise rewrite. |
| `intentional-non-angular` | Plain CSS package, stamped HTML aliases, vendored tokens | Keep; cite the ADR |

Required leftover table columns: path, class, shipped-by, Angular equivalent, gate/owner, delete-after.

Do not treat Theme Package CSS, stamped HTML aliases, or recorded document/iframe adapters as leftover JS. Do not delete `rollback-copy` files before parity, a live Angular origin, and the observation gate. Record the leftover scan in the planning deliverable (this repo: [docs/migration/leftover-inventory.md](../../../docs/migration/leftover-inventory.md)).

## Design the smallest justified Angular architecture

- Use standalone components and `bootstrapApplication`. Do not introduce NgModules for new code.
- Organize by feature or route. Reserve `core` for app-wide infrastructure and `shared` for proven reusable primitives; avoid dumping grounds.
- Keep presentation and interaction in components. Put reusable domain logic in plain TypeScript or focused services. Isolate HTTP, browser storage, analytics, and third-party SDKs behind typed boundaries.
- Use signals for local synchronous state and derivation; use `computed` for derived state. Use RxJS for cancellation, event streams, WebSockets, and multi-source async orchestration. Avoid mirroring the same state across both without a clear boundary.
- Evaluate stable Angular 22 APIs such as Signal Forms, asynchronous signal APIs, and Angular Aria based on fit. Do not adopt them merely because they are new.
- Use functional providers, guards, interceptors, lazy routes, built-in control flow, strict templates, and the CLI application builder.
- Prefer native CSS animations. Do not introduce deprecated `@angular/animations` APIs.
- Decide CSR, prerendering, SSR, hydration, service workers, external state libraries, Angular Material/CDK, monorepo tooling, and micro-frontends only from measured needs.
- Keep runtime configuration typed and public. Never put secrets in frontend environment files.
- Preserve static-host deep links, base href, redirects, cache behavior, and asset paths.

Read [angular-22-architecture.md](references/angular-22-architecture.md) for detailed choices and primary sources. Verify unstable claims immediately before implementation.
Use [planning-templates.md](references/planning-templates.md) when the result will be handed to another agent or split into implementation milestones.

## Plan incremental migration

Prefer a strangler approach for live or poorly tested apps:

1. Capture behavior with screenshots, user-flow notes, fixtures, contract tests, and characterization tests.
2. Establish Angular workspace, strict settings, build/deploy parity, tokens, and shell boundaries.
3. Select one low-coupling but representative vertical slice.
4. Migrate behavior without redesign.
5. Run legacy and Angular versions side by side behind routes, deploy targets, or flags where practical.
6. Compare functionality, accessibility, visuals, performance, analytics, and deployment output.
7. Extract shared primitives only after a second concrete use validates the abstraction.
8. Switch traffic with an explicit rollback path.
9. Remove leftover `rollback-copy` files only after leftover-behavior is fixed or deferred, the live origin is Angular, and the observation gate closes. That leftover-cleanup step is the last A-milestone (apply the deletion list, drop `artifact=legacy` source-tree sync, Angular-only README).

Separate workstreams:

- A: required behavior-preserving framework migration.
- B: shared design-system extraction after proven reuse.
- C: optional product or visual redesign.
- D: optional backend/API changes.

Do not combine B-D with A unless the dependency is unavoidable and documented.

## Produce the planning deliverable

Return in this order:

1. Executive summary and recommendation.
2. Verified repository findings and scope boundary.
3. App inventory table.
4. Leftover scan table (path, class, shipped-by, Angular equivalent, gate/owner, delete-after).
5. Representative flow traces.
6. Unknowns and explicit assumptions.
7. Target architecture.
8. Short ADRs with context, decision, alternatives, consequences, evidence, and official source URLs.
9. Current-to-target mapping for pages, routes, components, state, services, styles, assets, and deployments.
10. Dependency-ordered, independently shippable milestones.
11. Per-app migration cards.
12. Test and parity strategy.
13. Accessibility, security, SEO, performance, analytics, and deployment plan.
14. Risk register with likelihood, impact, mitigation, and decision/owner needed.
15. First vertical slice and why it maximizes learning while limiting risk.
16. Exact next actions for implementation.
17. Primary-source list with direct URLs.

Each migration card must contain scope, prerequisites, behavior to preserve, likely paths, implementation outline, acceptance criteria, tests, performance checks, deployment, rollback, risks, and definition of done.

## Require quality gates

Before calling a slice complete, require:

- Production build, strict template/type checks, lint, and tests pass.
- Behavior, URLs, storage, API contracts, analytics, and appearance meet the agreed parity baseline.
- Keyboard operation, focus, semantics, labels, contrast, reduced motion, and appropriate screen-reader behavior are verified.
- Loading, empty, error, offline, retry, and cancellation states are intentional where applicable.
- No secrets ship to the browser; external data and navigable URLs are handled safely.
- Bundle size and relevant Core Web Vitals are measured against the baseline.
- Hosting output, base paths, redirects, cache headers, and rollback artifacts are verified.
- Architectural decisions and remaining legacy boundaries are recorded.
- Leftover scan is recorded. No `unmigrated-feature` leftovers remain. `leftover-behavior` is fixed or explicitly deferred. `rollback-copy` leftovers have a deletion list and gate owner.

## Avoid failure modes

- Do not wrap imperative DOM code inside Angular components and label it migrated.
- Do not create speculative base classes, generic repositories, stores, or libraries.
- Do not add NgRx, Nx, Material, SSR, PWA, or micro-frontends by default.
- Do not mix a visual redesign into behavior-preserving migration estimates.
- Do not sequence from file count alone; use behavior, coupling, state, and deployment risk.
- Do not produce false-precision estimates while major unknowns remain.
- Do not delete leftover implementations before parity, live Angular, observation, and rollback gates pass.
- Do not leave dual-maintenance vanilla trees undocumented.
- Do not start a second framework migration for `rollback-copy` files.
- Do not delete rollback stock mid-migration to “clean up”.
- Do not treat Theme Package CSS, stamped HTML aliases, or recorded adapters as leftover JS.
