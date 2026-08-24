---
name: page-accessibility
description: >-
  Audit and plan WCAG page accessibility work for any page and its child
  components. Use when making a page accessible, supporting users with visual
  disabilities, checking screen-reader or keyboard behavior, or when the user
  combines accessibility work with /grill-with-docs or /research. For every
  frontend app at once, use frontend-page-accessibility instead.
---

# Page Accessibility

Use this skill for accessibility work on a specific page, including the page shell, route container, child components, localized UI copy, tests, and documentation.

## Workflow

1. Identify the target page.
   - Prefer the focused file or explicit path from the user.
   - If the user asked to run accessibility across all frontend Applications, to trigger the frontend page-accessibility workflow, or to parallelize that work in Multitask Mode, **stop** and follow [frontend-page-accessibility](../frontend-page-accessibility/SKILL.md) instead.
   - If the page is unclear, ask one question before exploring widely.

2. Load project context before feature work.
   - Read `CONTEXT-MAP.md`.
   - Read the relevant bounded-context `CONTEXT.md`.
   - Use glossary terms in questions, plans, docs, tests, and code.
   - If the user uses a conflicting or fuzzy term, call it out immediately and ask which meaning they intend.

3. Trace the full page accessibility surface.
   - Page route and resolver/guard.
   - Page component `.ts` and `.html`.
   - Shell/layout components used by the page.
   - Direct child components and their templates.
   - Shared UI primitives used by those components.
   - Transloco keys in `public/assets/i18n/en.json` and `public/assets/i18n/nl.json`.
   - Existing specs for the page and child components.

4. Research primary sources.
   - Prefer W3C WCAG, WAI-ARIA Authoring Practices, Angular accessibility docs, Angular CDK/Aria docs, and axe-core docs.
   - If the user asked for `/research`, spin up or perform research against primary sources and save a concise Markdown note where the repo keeps docs, commonly under `docs/accessibility/`.
   - Cite sources for claims in the research note.

5. Grill the design one decision at a time.
   - Ask only questions that code exploration cannot answer.
   - Ask one question at a time and recommend an answer.
   - Resolve accessibility target first, usually WCAG 2.2 AA for the page and children.
   - Resolve verification strategy before implementation, usually automated axe coverage plus focused component assertions and manual keyboard/screen-reader checks.
   - Resolve page heading semantics before editing, usually one page-level `h1` and labelled sections below it.

6. Plan the change before editing when the scope is broad.
   - Include exact files to inspect or change.
   - Keep the plan focused on accessibility behavior: headings, landmarks, names, roles, states, focus, announcements, keyboard operation, contrast-sensitive styling, and localized copy.
   - State out-of-scope behavior explicitly.

7. Implement conservatively.
   - Prefer native HTML semantics over ARIA.
   - Use ARIA only where native semantics do not express the relationship or state.
   - Keep decorative icons, initials, skeleton blocks, and dividers hidden from assistive tech.
   - Use `role="status"` or `aria-live` for non-urgent loading/status updates.
   - Use `role="alert"` for errors that appear after user or route activity.
   - Use `aria-expanded`, `aria-controls`, and stable ids for disclosure-style controls.
   - Preserve Angular conventions: standalone components, `ChangeDetectionStrategy.OnPush`, external templates, Transloco copy, built-in control flow, and Tailwind utilities only.

8. Verify.
   - Add or update focused tests for accessible names, landmarks, headings, state attributes, loading announcements, and error announcements.
   - Add axe-core coverage when the user allows a dependency or the repo already has it.
   - Run the relevant frontend test command and build/lint checks for touched files when practical.
   - Report any manual checks still needed, especially real screen-reader behavior and contrast review that automated tools cannot fully prove.

## Default Plan Template

```markdown
# [PageName] Accessibility Plan

## Scope
- Target page, route, shell, child components, shared UI primitives, i18n keys, and tests.

## Sources
- Primary accessibility sources to use and any research note to create.

## Implementation
- Semantic structure: headings, landmarks, regions, lists.
- Accessible names and descriptions: labels, labelledby/describedby, decorative content.
- Dynamic behavior: focus, keyboard, loading/status, errors, expanded/collapsed state.
- Localization: visible and screen-reader-only copy in supported locales.

## Verification
- Automated axe coverage.
- Focused component assertions.
- Manual keyboard and screen-reader checks.

## Out Of Scope
- Domain behavior, data fetching, routing semantics, or unrelated styling unless needed for accessibility.
```

## Documentation Rules

- Update `CONTEXT.md` only for resolved domain glossary terms, never for implementation details.
- Create an ADR only when the decision is hard to reverse, surprising without context, and based on a real trade-off.
- Keep accessibility research notes separate from glossaries.
