# Cursor planning prompt: mikepattyn.nl Vanilla JavaScript to Angular 22

Run this in Cursor Plan mode from the repository root. It deliberately forbids implementation until discovery is complete.

```text
Act as a principal Angular architect and migration lead with deep experience in Angular 22, TypeScript 6, frontend platform architecture, incremental legacy modernization, accessibility, web performance, testing, and static/cloud deployments.

You are conducting a PLANNING SESSION. Do not implement or modify application code yet. Your job is to inspect this repository deeply and produce a repository-specific, execution-ready migration plan that another coding agent can follow without having to rediscover the system.

# Objective

Migrate the Vanilla HTML/CSS/JavaScript applications hosted as part of mikepattyn.nl into production-grade Angular 22 applications.

The required migration must preserve, unless explicitly approved otherwise:
- User-visible behavior and workflows
- Existing public URLs, deep links, hashes, and query parameters
- Visual identity, responsive behavior, assets, and animations
- API and storage contracts
- Authentication behavior
- Analytics/event semantics
- SEO metadata and public crawlability
- Accessibility behavior or improve it where current behavior is deficient
- Build, hosting, deployment, cache, and rollback behavior

Treat framework migration and redesign as separate workstreams. Do not hide redesign, backend changes, dependency replacement, or speculative cleanup inside the framework-migration plan.

# Repository and access discipline

The repository is the source of truth. Do not assume its structure from this prompt or from common conventions.

Classify statements as:
- VERIFIED: directly supported by a repository path, symbol, config, or command output
- INFERRED: strongly suggested by evidence but not proven
- RECOMMENDED: proposed target-state choice
- UNKNOWN: material information not available

For every important current-state claim, cite repository paths and relevant symbols/sections. For every important Angular/version claim, cite a direct official Angular URL.

If a missing fact could materially change the architecture, migration order, deployment design, security posture, or estimate, record it as an explicit blocker or question. Do not manufacture an answer.

# Version and tooling baseline

Target the latest stable Angular 22 patch compatible with this repository.

Before proposing package versions, verify:
- https://angular.dev/reference/versions
- https://angular.dev/reference/releases
- https://blog.angular.dev/announcing-angular-v22-c52bb83a4664
- https://angular.dev/events/v22

At the time this prompt was prepared, Angular 22.0 listed:
- Node.js ^22.22.3, ^24.15.0, or ^26.0.0
- TypeScript >=6.0.0 <6.1.0
- RxJS ^6.5.3 or ^7.4.0

Recheck rather than trusting those values blindly.

Apply Angular 22 conventions:
- Standalone components are the default; do not add redundant `standalone: true`.
- Zoneless change detection is the default; do not add ZoneJS without a proven compatibility reason.
- OnPush behavior is the default; do not mechanically add `ChangeDetectionStrategy.OnPush`.
- Vitest is the primary unit test runner.
- Prefer built-in control flow and strict template/type checking.
- Signal Forms, asynchronous signal APIs, and Angular Aria are stable in Angular 22, but adopt them only when they fit the discovered requirements.
- Avoid new use of deprecated `@angular/animations`; prefer native CSS animations.

Also use the official AI guidance:
- https://angular.dev/ai/develop-with-ai
- https://angular.dev/ai/mcp

If the Angular CLI MCP server is configured in Cursor, call its best-practices/workspace tools. If it is not configured, recommend (but do not install without approval) this project-level `.cursor/mcp.json` setup:

{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}

# Phase 0 — establish repository scope

Start by identifying:
- Repository root and current branch
- Package manager and lockfiles
- Node/tool version files
- Top-level apps/sites/packages
- Generated, vendored, and deployment-output directories to exclude
- Existing Angular/React/Vue/etc. code that must not be mistaken for Vanilla JS
- Git submodules or nested projects
- CI and deployment configuration

Show the commands/searches used and summarize results concisely. Prefer `rg --files`, targeted `rg`, and config/entry-point inspection over dumping large files.

# Phase 1 — full application inventory

Discover every Vanilla application, page, widget, or interactive experience. Do not decide the Angular workspace topology until this inventory is complete.

For each app, inspect and record:

## Identity and entry
- App name and purpose
- Directory and ownership boundary
- HTML entry point(s)
- JavaScript entry point(s) and module format
- CSS entry point(s), global styles, assets, fonts, and icons
- How the app is reached from mikepattyn.nl

## Navigation and lifecycle
- Path, hash, query parameter, and in-page navigation
- Deep-link and reload behavior
- Base path/base href requirements
- Initialization and teardown behavior
- Popstate/hashchange listeners
- Timers, observers, service workers, workers, and background behavior

## DOM and UI behavior
- DOM queries and mutation ownership
- Event listeners, delegation, keyboard, pointer, touch, and gesture behavior
- Dynamic HTML/template generation
- Modal, focus, scroll, selection, media, canvas, SVG, WebGL, map, chart, or animation behavior
- Loading, empty, error, offline, retry, and cancellation states
- Responsive and reduced-motion behavior

## State and persistence
- Global variables and implicit state
- Derived state and invariants
- localStorage, sessionStorage, cookies, IndexedDB, URL state, or cross-tab messaging
- Persisted key names, schemas, migration needs, expiry, and privacy implications

## Data and integrations
- fetch/XHR/WebSocket/SSE endpoints
- Request, response, error, retry, and cancellation behavior
- Auth and token handling
- External SDKs, scripts, CDNs, analytics, maps, payments, AI, media, or social integrations
- Environment variables/runtime configuration
- Any secret or credential at risk of entering browser bundles

## Styling and assets
- CSS architecture and cascade assumptions
- Design tokens/colors/spacing/typography
- Shared versus app-specific styles
- Breakpoints and container assumptions
- Images, video, audio, fonts, favicon/manifest, and asset paths
- Animations/transitions and browser-specific behavior

## Quality and operations
- Unit/integration/E2E tests
- Manual QA instructions
- Lint, formatting, and type checking
- Accessibility measures
- Analytics and event names
- Error reporting and logging
- SEO/meta/structured data
- Performance measurements or budgets
- Build command and output directory
- Hosting target, redirects, headers, cache rules, CDN, invalidation, environment promotion, and rollback

## Risk
- Coupling to other pages/apps
- Implicit browser or deployment assumptions
- Security and privacy concerns
- Untested business behavior
- Fragile animation/layout behavior
- Third-party compatibility

Create a complete inventory table with these columns:
App/path | Purpose | Entry points | Navigation | DOM complexity | State/persistence | APIs/SDKs | Shared candidates | Test baseline | Deployment unit | Complexity | Migration risk | Recommended order | Evidence

# Phase 1b — leftover scan

After the inventory, scan each app for leftover vanilla beside the Angular `src/` tree. Ignore `node_modules`, `dist`, `.angular`, and coverage.

Search for root HTML with `script src="js/`, `js/**/*.js`, duplicate `css/` vs `src/styles.css`, and `innerHTML` / `querySelector` / `addEventListener` in `src/` (review, do not auto-fail).

Classify every hit as `unmigrated-feature`, `rollback-copy`, `leftover-behavior`, `vanilla-style-angular`, or `intentional-non-angular`. Produce a leftover table with: path | class | shipped-by | Angular equivalent | gate/owner | delete-after.

Do not start a new framework migration for `rollback-copy` files. Do not treat Theme Package CSS, stamped HTML aliases, or recorded document/iframe adapters as leftover JS. Do not delete `rollback-copy` leftovers before parity, a live Angular origin, and the observation gate.

Trace at least one representative user journey per app as:
user event -> handler -> validation -> state/data operation -> rendering/DOM result -> persistence -> analytics/side effects

For complex apps, trace happy path plus one failure path.

# Phase 2 — baseline and parity contract

Define how we will prove that migration preserved the apps before removing Vanilla code.

Propose:
- Characterization tests around high-risk pure logic
- API fixtures or contract tests
- Screenshot/visual baselines at important viewport sizes
- Critical user-flow E2E coverage
- URL/deep-link checks
- Storage compatibility checks
- Analytics event parity checks
- Accessibility baseline and target
- Performance baseline: LCP, INP, CLS, initial JS, route chunks, and important interaction timing
- Deployment-artifact smoke tests using real subpaths/base href

List behavior that is ambiguous or appears buggy. Do not silently preserve or fix it: put it in a decision table with evidence, user impact, preserve/fix recommendation, and required approval.

# Phase 3 — architecture options before recommendation

Evaluate at least these topologies against repository evidence:

1. One Angular workspace, one routed application
2. One Angular workspace, multiple independently built/deployed Angular applications
3. Separate Angular workspaces
4. Incremental islands/custom-elements approach only if current embedding/deployment makes it useful

Compare them on:
- Current deployment boundaries
- Release independence
- Shared code and design tokens
- Runtime isolation
- Bundle duplication
- Routing/deep links
- CI complexity
- Local developer experience
- Ownership and future growth
- Migration coexistence and rollback

Recommend one, reject the others explicitly, and state what evidence would cause the decision to change.

# Phase 4 — target Angular 22 architecture

Design the smallest architecture justified by the repository.

Address explicitly:

## Workspace and boundaries
- Angular projects, libraries, and build targets
- App shell and route boundaries
- Feature-oriented folder structure
- `core` responsibilities
- Criteria for genuinely reusable `shared` UI or workspace libraries
- Public APIs and dependency direction

Do not create empty ceremonial layers. Do not extract a shared abstraction before two concrete consumers prove it.

## Components and templates
- Page/container versus presentational UI boundaries
- Signal inputs/models/outputs
- Built-in `@if`, `@for`, `@switch`, and measured `@defer`
- Semantic HTML and Angular Aria/CDK/custom UI choice
- Browser API adapters instead of scattered global DOM access

## State and async
- Signals for local synchronous state
- `computed` for pure derivation
- RxJS for cancellation, WebSockets, debouncing, and multi-source async workflows
- Whether stable `resource`/`httpResource` fits any concrete data access
- Whether an external store is justified; default to none
- Clear server-state ownership and idle/loading/success/empty/error/retry/cancelled states
- Avoid duplicated signal/observable ownership

## Forms
Compare stable Angular 22 Signal Forms and Reactive Forms for the actual forms discovered. Decide per app or form family, considering complexity, existing behavior, validation, integrations, team familiarity, and migration risk. Do not mix paradigms within one form without a clear interoperability reason.

## Data access and security
- Typed API clients and DTO/domain/view-model boundaries
- Functional interceptors and auth handling
- Storage adapters and schema/version migration
- Runtime configuration versus compile-time configuration
- Sanitization, trusted URLs, CSP, external scripts, and browser-secret prevention
- Error normalization, retry, cancellation, and observability

## Rendering and performance
Decide CSR/prerender/SSR/hybrid per route from evidence. Include hosting/runtime cost, SEO, caching, hydration, browser API compatibility, and rollback. Do not recommend SSR as a generic best practice.

Define lazy loading, chunk boundaries, image/font strategy, list tracking, defer opportunities, animation strategy, and budgets.

## Styling
- Preserve cascade-dependent behavior safely
- Move tokens into an intentional token layer
- Decide global versus component styles
- Define responsive strategy
- Preserve or replace animations using native CSS with reduced-motion behavior
- Keep redesign separate

## Testing and delivery
- Vitest unit/component strategy
- HTTP/provider integration tests
- E2E runner choice based on existing tooling/CI
- Accessibility automation plus manual checks
- Visual regression strategy
- CI gates and build budgets
- Static-host/deployment smoke testing
- Observability and analytics parity

# Phase 5 — ADRs

Write a short Architecture Decision Record for every material decision:
- Title/status
- Context
- Decision
- Alternatives considered
- Consequences and tradeoffs
- Repository evidence
- Official Angular source URLs
- Revisit trigger

At minimum cover:
- Workspace/app topology
- Legacy coexistence and cutover
- State/RxJS boundary
- Form strategy
- Rendering mode per public route category
- Styling/token strategy
- Shared-code extraction rule
- Testing stack
- Runtime configuration/auth boundary

# Phase 6 — migration roadmap

Prefer an incremental strangler migration unless the inventory proves that replacement is cheaper and equally safe.

Separate:
A. Required behavior-preserving Angular migration
B. Shared design-system extraction after proven reuse
C. Optional UX/visual redesign
D. Optional backend/API modernization

Create dependency-ordered, independently shippable milestones. Every milestone must include:
- Goal and user value
- Exact scope and likely paths
- Prerequisites and dependencies
- Current behavior/contracts to preserve
- Target architecture slice
- Implementation outline without writing code
- Acceptance criteria
- Unit/component/integration/E2E/accessibility/visual tests
- Performance and bundle checks
- Analytics and observability checks
- Deployment and rollback plan
- Risks and mitigations
- Exit criteria and definition of done

Select the first vertical slice using these criteria:
- Representative enough to validate the architecture
- Low coupling and reversible deployment
- Contains at least one real interaction and one meaningful state/data boundary
- Has a measurable parity baseline
- Avoids building speculative shared infrastructure first

Explain why the selected slice maximizes learning per unit of risk.

# Phase 7 — per-app migration cards

For each app, create a concise but execution-ready card:
- Current app and evidence paths
- User journeys
- Angular routes/pages/components
- State, data access, forms, and storage mapping
- Styles/assets mapping
- External integration adapters
- Characterization and parity tests
- Accessibility requirements
- Security/performance concerns
- Dependencies
- Step sequence
- Acceptance criteria
- Cutover and rollback
- Open decisions

# Required final deliverable

Return exactly these top-level sections:

1. Executive Summary
2. Scope and Evidence Method
3. Verified Repository Findings
4. Application Inventory
5. Leftover Scan
6. Representative Flow Traces
7. Unknowns, Assumptions, and Blocking Questions
8. Baseline and Parity Contract
9. Architecture Options Compared
10. Recommended Angular 22 Architecture
11. Architecture Decision Records
12. Current-to-Target Mapping
13. Dependency-Ordered Migration Roadmap
14. Per-App Migration Cards
15. Test and Quality Strategy
16. Accessibility, Security, SEO, Performance, Analytics, and Deployment
17. Risk Register
18. First Vertical Slice
19. Exact Next Actions for the Implementation Agent
20. Primary Sources

The risk register must include:
Risk | Evidence | Likelihood | Impact | Mitigation | Trigger | Owner/decision needed

The implementation handoff must include:
- The first files/configs the implementation agent should inspect
- Proposed commands, but do not run mutations during this planning session
- The first milestone's ordered steps
- Tests to run after each step
- Stop/rollback conditions
- Decisions requiring Mike's approval

# Quality bar and stop conditions

- Do not modify files or install packages during this planning session.
- Do not describe wrapping legacy imperative DOM code in an Angular component as a completed migration.
- Do not add NgRx, Nx, Angular Material, SSR, PWA, micro-frontends, or workspace libraries without evidence.
- Do not use file count alone for estimates or sequencing.
- Do not invent effort estimates while material unknowns remain. Use relative sizing and confidence first; give calendar estimates only if asked and assumptions are stated.
- Do not delete or decommission leftover Vanilla trees until leftover-behavior is fixed or deferred, the live origin is Angular, and observation and rollback gates pass.
- Do not start a second framework migration for `rollback-copy` leftovers.
- Do not treat Theme Package CSS, stamped HTML aliases, or recorded adapters as leftover JS.
- Do not present inferred facts as verified.
- If repository discovery is too incomplete to select architecture safely, stop after the inventory and ask only targeted, material questions.

Begin with Phase 0. Give brief progress checkpoints while inspecting, then produce the complete planning deliverable.
```
