# Style reference — draw.io AWS diagrams

## mxfile skeleton

```xml
<mxfile host="app.diagrams.net" agent="Cursor" version="24.0.0">
  <diagram id="platform" name="Diagram name">
    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2400" pageHeight="1680" math="0" shadow="0" adaptiveColors="auto">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ...cells...
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## Container (swimlane)

Children set `parent="<container id>"` and use coordinates relative to the container. Cross-container edges use `parent="1"`.

```xml
<mxCell id="LANE" value="Lane title" style="swimlane;startSize=26;html=1;whiteSpace=wrap;container=1;pointerEvents=0;collapsible=0;fontStyle=1;fillColor=#e8f4f8;strokeColor=#6c8ebf;" vertex="1" parent="aws">
  <mxGeometry x="16" y="256" width="2108" height="680" as="geometry"/>
</mxCell>
```

Lane fills in use: AWS outer `#f7f7f7`/`#232F3E`, platform `#f5f5f5`/`#666666`, mikepattyn.nl `#e8f4f8`/`#6c8ebf`, Kapsalon `#e8f5e9`/`#82b366`, Fish `#e3f2fd`/`#6c8ebf`, sites `#fff9e6`/`#d6b656`, pattynologies `#fff0e6`/`#d79b00`, alienbutnice `#f3e8ff`/`#9673a6`.

## AWS aws4 icon styles

Node template (split label lines with `&#xa;`):

```xml
<mxCell id="ID" value="Label&#xa;detail" style="STYLE" vertex="1" parent="LANE">
  <mxGeometry x="X" y="Y" width="78" height="78" as="geometry"/>
</mxCell>
```

Resource-icon wrapper (framed 2024 icons) — substitute `{FILL}` and `{SERVICE}`:

```
sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;fillColor={FILL};strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.{SERVICE};
```

Pictogram wrapper (unframed shapes) — substitute `{FILL}` and `{SHAPE}`:

```
sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor={FILL};strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.{SHAPE};
```

| Service | Wrapper | `{SERVICE}` / `{SHAPE}` | `{FILL}` | w×h |
|---|---|---|---|---|
| Route 53 | resource | `route_53` | `#8C4FFF` | 78×78 |
| CloudFront | resource | `cloudfront` | `#8C4FFF` | 78×78 |
| API Gateway | resource | `api_gateway` | `#E7157B` | 78×78 |
| Lambda | resource | `lambda` | `#ED7100` | 78×78 |
| DynamoDB | resource | `dynamodb` | `#C925D1` | 78×78 |
| Secrets Manager | resource | `secrets_manager` | `#DD344C` | 78×78 |
| ACM certificate | resource | `certificate_manager_3` | `#DD344C` | 78×78 |
| WAF | resource | `waf` | `#DD344C` | 78×78 |
| IAM | resource | `identity_and_access_management` | `#DD344C` | 78×78 |
| S3 bucket | pictogram | `bucket` (or `bucket_with_objects`) | `#7AA116` | 75×78 |
| SSM Parameter Store | pictogram | `parameter_store` | `#E7157B` | 75×78 |
| Users | pictogram | `authenticated_user` | `#232F3D` | 78×78 |

One-off styles:

```
GitHub logo (75×75):
dashed=0;outlineConnect=0;html=1;align=center;labelPosition=center;verticalLabelPosition=bottom;verticalAlign=top;shape=mxgraph.weblogos.github;

External SaaS box (110×44):
rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;
```

## Edge templates

Solid (request path — optional `value` label like `default` or `/api/*`):

```xml
<mxCell id="eNN" edge="1" parent="1" source="A" target="B" value="label" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeColor=#7AA116;">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

Dashed (secrets / SaaS / deploy — swap `strokeColor` per the visual-language table in SKILL.md):

```xml
<mxCell id="eNN" edge="1" parent="1" source="A" target="B" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;dashed=1;strokeColor=#DD344C;">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

Every edge cell must contain the `<mxGeometry relative="1" as="geometry"/>` child — a self-closing edge cell will not render.
