---
name: drawio-aws-architecture
description: Creates and maintains draw.io AWS architecture diagrams for this repo (docs/architecture/*.drawio, AWS aws4 icon set) from the CDK source of truth in infra/cdk. Use when CDK stacks or constructs change (new app, stack, Lambda, bucket, table, secret, or domain), when the user asks to create, update, redraw, sync, or render an architecture diagram, or mentions draw.io, drawio, AWS icons, or the architecture sketch.
---

# Draw.io AWS architecture diagram

The platform diagram lives at `docs/architecture/mikepattyn-platform.drawio`. CDK code is the source of truth; the diagram is a view of it. Never draw resources that are not in CDK, and never change CDK code as part of diagram work.

## Source of truth

| What | Where |
|---|---|
| Stack wiring — every stack, environment, domain import | `infra/cdk/Mikepattyn.CDK/StackComposition.cs` |
| Per-stack resources | `infra/cdk/Mikepattyn.CDK.Constructs/Stacks/**` |
| Shared constructs (S3+OAC+CloudFront hosting with optional `/api/*` origin, Lambda sets, GitHub OIDC role) | `infra/cdk/Mikepattyn.CDK.Constructs/Constructs/**` |
| Hostname table | `CONTEXT.md` at the repo root |

## Maintenance workflow

1. **Diff code against diagram.** Read `StackComposition.cs` plus any stack class that changed. List what the diagram currently shows by searching the `.drawio` file for `mxCell id=` — every node id and every edge's `source=`/`target=` is in those matches.
2. **Decide placement** using the lane map below.
3. **Edit the XML surgically** with StrReplace: add, update, or delete whole `<mxCell>` blocks. Keep existing ids stable. When deleting a node, also delete every edge whose `source=` or `target=` references it.
4. **Verify:** ids unique, no XML comments anywhere, labels escaped (`&lt; &gt; &amp; &quot;`, line breaks as `&#xa;`), file ends with `</root>` `</mxGraphModel>` `</diagram>` `</mxfile>`.
5. **Render** with the draw.io MCP tool `create_diagram`: pass the inner `<mxGraphModel>...</mxGraphModel>` element (not the `<mxfile>` wrapper) as `xml`, with `routing: "libavoid"`. Never set `postLayout` — the layout is hand-placed and must not be re-laid-out. If the MCP server errors, say so; the saved file is still the deliverable and opens at app.diagrams.net.
6. Do not commit unless the user asks.

## Lane map

Everything AWS sits inside the `aws` container. Externals (users, GitHub Actions, Authress, Zoho, Mollie, Turnstile) sit outside it in the left column at `parent="1"`.

| Container id | Contents |
|---|---|
| `platform` | One Route 53 zone per brand domain, ACM (us-east-1 imports), IAM GitHub-OIDC deploy role, SSM Parameter Store |
| `mp` | mikepattyn.nl lane — child containers `kap` (Kapsalon ×3 envs), `fishg` (Fish ×3 envs), `sites` (Portfolio, Lumen, Dashboard, Viewports, Theming) |
| `patty` | pattynologies.com brand fronts (prod + dev preview) and the Commerce backend |
| `abn` | alienbutnice.nl brand front, plus the legend `note` cell |

Placement rules:

- New production-only app on mikepattyn.nl → CloudFront + S3 (plus API Gateway + Lambda if it has a backend) inside `sites`.
- New multi-environment app → its own child container inside `mp`, following the `kap`/`fishg` pattern.
- New brand domain → Route 53 icon in `platform` plus a new top-level lane inside `aws`.
- Grow a container before adding nodes past its edge; child coordinates are relative to the container. Icons are 78×78 (buckets 75×78); use ~150–170 px column pitch, ~140–170 px row pitch, first row at y≈40–50 under the title bar.

## CDK pattern → diagram shapes

- `FrontendStack` / `BrandFrontendStack` (`WebApplicationHostingConstruct`) → CloudFront + S3 bucket; add a pink `/api/*` edge only when `ApiGatewayDomainName` is wired.
- Backend stacks → API Gateway + Lambda set + DynamoDB + Secrets Manager (+ WAF where `ApiGatewayConstruct` attaches one, e.g. Kapsalon).
- `EmailLambdaConstruct` → Lambda with a Secrets Manager node and a dashed edge to the Zoho external.
- `AuthStack` growth (more bucket ARNs) usually needs no diagram change — the dashed `deploy` edges point at lanes, not individual buckets.

## Visual language

All edges: `parent="1"`, style starts `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;`, and every edge cell contains an `<mxGeometry relative="1" as="geometry"/>` child. Never add waypoints or exitX/entryX overrides.

| Edge | Meaning |
|---|---|
| solid `#232F3E` | user request to DNS |
| solid `#8C4FFF` | Route 53 → CloudFront |
| solid `#7AA116`, label `default` | CloudFront → S3 origin |
| solid `#E7157B`, label `/api/*` | CloudFront → API Gateway (same-origin API) |
| solid `#ED7100` | API Gateway → Lambda |
| solid `#C925D1` | Lambda → DynamoDB |
| dashed `#DD344C` | secret read / Authress |
| dashed `#E7157B` | deploy path (GitHub → IAM role → lanes; IAM → SSM) |
| dashed `#82b366` / `#d6b656` | external SaaS calls (Mollie / Zoho) |

If a new edge meaning is introduced, update the legend `note` cell in the `abn` container.

## Icons

Exact aws4 style strings, the mxfile skeleton, and container/edge templates: read [icon-styles.md](icon-styles.md). For a service not listed there, call the draw.io MCP `search_shapes` with a short query like `aws lambda` and prefer a `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.<service>` result (2024 icon set, category color baked in). If `search_shapes` returns a server error, retry once with a simpler two-word query.

## Creating a new diagram

Same conventions, new file under `docs/architecture/<name>.drawio`: start from the skeleton in [icon-styles.md](icon-styles.md), place externals left, a `platform`-style lane on top, one lane per domain, per-app child containers, wire edges per the visual language, then render (workflow step 5).
