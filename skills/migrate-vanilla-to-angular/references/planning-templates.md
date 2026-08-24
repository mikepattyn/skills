# Planning templates

Use these schemas for consistent handoffs. Add fields only when the repository needs them.

## App inventory

| App/path | Purpose | Entry points | Navigation | DOM complexity | State/persistence | APIs/SDKs | Shared candidates | Tests | Deployment unit | Complexity | Risk | Order | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Leftover scan

| Path | Class | Shipped by | Angular equivalent | Gate/owner | Delete after |
| --- | --- | --- | --- | --- | --- |

Classes: `unmigrated-feature` | `rollback-copy` | `leftover-behavior` | `vanilla-style-angular` | `intentional-non-angular`

## Fact ledger

| Statement | Status | Evidence | Architectural effect | Follow-up |
| --- | --- | --- | --- | --- |
|  | Verified / Inferred / Recommended / Unknown | Path, symbol, config, command, or URL |  |  |

## Flow trace

```text
Flow: <name>
Entry/URL:
Trigger:
Validation:
State transition:
Data/integration:
Render result:
Persistence:
Analytics/side effects:
Failure behavior:
Evidence:
Parity checks:
```

## Architecture decision record

```text
ADR: <title>
Status: Proposed / Accepted / Superseded
Context:
Decision:
Alternatives:
Consequences:
Repository evidence:
Official sources:
Revisit trigger:
```

## Migration milestone

```text
Milestone: <name>
Goal/user value:
Scope:
Likely paths:
Prerequisites:
Behavior/contracts to preserve:
Target slice:
Ordered implementation steps:
Acceptance criteria:
Tests after each step:
Accessibility checks:
Performance/bundle checks:
Analytics/observability checks:
Deployment:
Rollback:
Risks/mitigations:
Exit criteria:
Out of scope:
```

## Per-app migration card

```text
App:
Current paths:
Purpose and user journeys:
Current routes/entry points:
Target routes/pages/components:
State mapping:
Data/API mapping:
Forms mapping:
Storage compatibility:
Styles/assets mapping:
Integration adapters:
Characterization baseline:
Unit/component/integration/E2E coverage:
Accessibility requirements:
Security/performance concerns:
Dependencies:
Step sequence:
Acceptance criteria:
Cutover:
Rollback:
Open decisions:
```

## Risk register

| Risk | Evidence | Likelihood | Impact | Mitigation | Trigger | Owner/decision needed |
| --- | --- | --- | --- | --- | --- | --- |

## Implementation handoff

```text
Approved target architecture:
Approved first milestone:
Read first:
Decisions already made:
Decisions still requiring approval:
Ordered steps:
Verification command after each step:
Artifacts to compare:
Stop conditions:
Rollback procedure:
Expected commit/PR boundaries:
Explicit non-goals:
```
