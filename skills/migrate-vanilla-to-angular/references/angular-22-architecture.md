# Angular 22 architecture reference

## Contents

- Version baseline
- Application structure
- Components and templates
- Reactivity, data, and forms
- Rendering and performance
- Testing and delivery
- Decision checklist
- Primary sources

## Version baseline

Use the latest stable Angular 22 patch compatible with the repository. As of August 2026, Angular 22.0 requires:

- Node.js `^22.22.3`, `^24.15.0`, or `^26.0.0`
- TypeScript `>=6.0.0 <6.1.0`
- RxJS `^6.5.3` or `^7.4.0`

Recheck https://angular.dev/reference/versions before installation because patch and minor releases change.

Angular 22 defaults matter:

- Components are standalone by default. Do not write `standalone: true` in new components.
- Zoneless change detection is the default. Do not add ZoneJS without a proven compatibility need.
- OnPush behavior is the default. Do not add `changeDetection: ChangeDetectionStrategy.OnPush` mechanically.
- Vitest is the primary Angular test runner.

## Application structure

Organize by product feature or route, not by technical artifact type. Start small:

```text
src/app/
  app.config.ts
  app.routes.ts
  core/
  shared/
  features/<feature>/
    pages/
    ui/
    data-access/
    domain/
```

Create only folders that contain real responsibilities. Co-locate unit tests. A workspace library needs a proven cross-app consumer, a stable public API, ownership, and independent value. Two similar files are a signal to compare, not automatic proof of an abstraction.

Use one workspace with multiple Angular application projects when the apps share tooling and dependencies but must remain independently built or deployed. Use one routed application when navigation, release cadence, runtime shell, and deployment are genuinely shared. Keep separate workspaces when ownership, runtimes, security boundaries, or release lifecycles differ materially.

## Components and templates

- Keep components focused on rendering and user interaction.
- Prefer `input()`, `output()`, signal queries, and typed models.
- Use built-in `@if`, `@for`, `@switch`, and `@defer` where appropriate.
- Use semantic HTML before ARIA. Consider stable Angular Aria patterns for headless accessible interactions that fit the UX.
- Use `NgOptimizedImage` where it improves image behavior.
- Prefer external templates/styles when components are substantial; consistency within a feature matters more than dogma.
- Avoid direct global DOM access. Wrap unavoidable browser APIs behind focused adapters and guard server execution when SSR/prerendering applies.

## Reactivity, data, and forms

Choose the state primitive by semantics:

| Need | Default tool |
| --- | --- |
| Local synchronous UI state | `signal` |
| Pure derived state | `computed` |
| Parent/child binding | signal inputs/models and outputs |
| HTTP or async value with simple lifecycle | Evaluate stable `resource`/`httpResource` |
| Cancellation, event streams, WebSockets, debouncing | RxJS |
| Cross-feature state with complex effects/entities | Evaluate a store only after evidence |

Do not store derived values manually. Keep effects rare and side-effect focused. Avoid bidirectional synchronization between signals and observables unless an adapter boundary requires it.

For forms, Angular 22 Signal Forms are stable and Reactive Forms remain supported. Choose per app:

- Prefer Signal Forms for new, signal-native forms when library integration, validation, and team familiarity fit.
- Prefer Reactive Forms when migrating complex existing forms, relying on mature integrations, or minimizing novelty.
- Do not mix both within one form without a specific interoperability reason.

Define typed data-access boundaries. Map transport DTOs to domain/view models when the shapes diverge. Model idle, loading, success, empty, error, retry, and stale/cancelled states explicitly where the user can observe them.

## Rendering and performance

Decide rendering per route:

- CSR for authenticated or highly interactive pages without crawl/first-render requirements.
- Prerendering for mostly static public content.
- SSR for public dynamic content where SEO or first response matters and hosting supports it.
- Hybrid rendering when route requirements differ.

Do not adopt SSR merely as a performance slogan; include server cost, caching, runtime APIs, hydration, failure modes, and deployment complexity.

Use lazy routes, stable tracking keys, `@defer` for measured non-critical work, explicit image dimensions, font strategy, and budgets. Baseline and compare LCP, INP, CLS, initial JS, route chunks, and important interaction timing.

Use native CSS transitions/animations and respect `prefers-reduced-motion`. The legacy Angular animations package is deprecated.

## Testing and delivery

Protect the migration with layers:

- Characterization tests and screenshots for legacy behavior.
- Unit tests for pure domain transformations and state transitions.
- Angular component tests for template interaction and provider boundaries.
- HTTP tests for requests, errors, cancellation, and mapping.
- A few critical end-to-end flows across routing and persistence.
- Automated accessibility checks plus manual keyboard and screen-reader review.
- Visual regression for design-sensitive apps.
- Deployment smoke tests against the built artifact and real base path.

Use Vitest for new Angular 22 unit/component tests unless repository constraints justify otherwise. Select an E2E runner based on current tooling and CI; Angular does not require a particular one.

Use the Angular CLI application builder. Keep ESM compatibility. Define build budgets and CI gates. Generate configuration at deployment/runtime when environments differ, but never imply that browser-readable runtime config can contain secrets.

## Decision checklist

Record an ADR when the answer materially changes coupling, deployment, or operations:

- Single app versus multiple Angular projects/workspaces.
- CSR, prerender, SSR, or hybrid per route.
- Signal Forms versus Reactive Forms.
- Signal/RxJS boundary and any external store.
- Shared package or copied-local implementation.
- Angular Aria/CDK/Material/custom UI.
- Authentication and runtime configuration boundary.
- Legacy coexistence, cutover, and rollback mechanism.
- Analytics/event parity.
- PWA/offline support.

## Primary sources

- Angular v22 release: https://blog.angular.dev/announcing-angular-v22-c52bb83a4664
- Angular v22 release overview: https://angular.dev/events/v22
- Version compatibility: https://angular.dev/reference/versions
- Releases and support: https://angular.dev/reference/releases
- Official AI/LLM instructions: https://angular.dev/ai/develop-with-ai
- Angular CLI MCP for Cursor: https://angular.dev/ai/mcp
- Style guide: https://angular.dev/style-guide
- Components: https://angular.dev/guide/components
- Signals: https://angular.dev/guide/signals
- RxJS interop: https://angular.dev/ecosystem/rxjs-interop
- Signal Forms: https://angular.dev/guide/forms/signals/overview
- Reactive Forms: https://angular.dev/guide/forms/reactive-forms
- Routing: https://angular.dev/guide/routing
- Dependency injection: https://angular.dev/guide/di
- HTTP client: https://angular.dev/guide/http
- SSR and hybrid rendering: https://angular.dev/guide/ssr
- Zoneless: https://angular.dev/guide/zoneless
- Build system: https://angular.dev/tools/cli/build-system-migration
- Testing: https://angular.dev/guide/testing
- Accessibility: https://angular.dev/best-practices/a11y
- Security: https://angular.dev/best-practices/security
- Runtime performance: https://angular.dev/best-practices/runtime-performance
- Native animation migration: https://angular.dev/guide/animations/migration
