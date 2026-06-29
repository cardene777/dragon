# topology preset

The `topology` preset is a high-level API that assembles an architecture diagram (a deployment diagram or system-architecture diagram, the kind that shows "what" sits "where") from three operations: `group` (a group), `container` (an element inside a group), and `connect` (a link between elements).
It corresponds to mermaid `C4` (system-architecture notation) or the parallel `subgraph` layout of a `flowchart`.

You declare a group and chain `.add` to drop containers inside; cross-group links go through `.connect`.
The engine auto-computes the `lane` (column) layout of each group and the `stack` (vertical order) of containers.

## When to use it

`topology` is ideal for hierarchical system architectures.
A three-tier deployment diagram (Client / Backend / DB) is where it shines.

- You want an AWS, GCP, or Azure deployment diagram.
- You want a microservice topology on a single page.
- You want a three-tier system architecture (Client / Backend / DB).

For round-trip timing, pick the [sequence preset](/docs/en/cdl/presets/sequence); for parallel-actor workflows, pick the [swimlane preset](/docs/en/cdl/presets/swimlane).

## Why split this preset

Building an architecture diagram with the low-level API forces you to declare a `contain = true` lane for every group and stack nodes inside, and a five-group diagram easily exceeds 30 lines.
The `topology` preset narrows the API to three operations - group, container, connect - so you only declare "what lives where" and "what connects to what."

> Difference from mermaid: mermaid `C4` is a dedicated DSL, while cdl `topology` is plain TypeScript with full IDE completion and type checking.

## Signature

::: tabs

@@@ humans 👤 For humans

A topology diagram in v0.5 Text DSL uses `type: topology`, lists containers flat in `actors`, and writes inter-container links in `flow`.

```text
title: "<deployment topic>"
type: topology

actors:
  - <Container 1>: <kind>
  - <Container 2>: <kind>
  - <Container 3>: <kind>

flow:
  - <Container 1> -> <Container 2>: "<label>"
  - <Container 2> -> <Container 3>: "<label>" (<tone>)
```

[preview:presets/topo-demo]

v0.5 Text DSL keeps containers flat, leaving group framing (a contained lane) and vertical stacking to the engine.
When you need hierarchical groups (Browser inside Client, ALB / ECS / RDS inside AWS, ...), see the "API Reference (chain API)" section at the bottom of this page.

@@@ llm 🤖 For LLM

```yaml
fn: topology(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      groupWidth: { type: number, optional: true, default: 460, range: [280, 720] }
      defaultTone: { type: Tone, optional: true }
      defaultStyle: { type: EdgeStyle, optional: true }
returns: TopologyBuilder { group, connect, build }
typical_use:
  - "AWS / GCP / Azure deployment diagram with 3-5 groups"
  - "microservice topology with hierarchical containers"
  - "3-tier system architecture (Client / Backend / DB)"
constraints:
  - "group(id, opts) is positional (id 1st, opts 2nd), unlike sequence / flow which take a single object"
  - "calling .group(id, ...) twice with the same id reuses the existing group and appends containers"
  - ".connect references container ids (not group ids), engine auto-routes cross-group connections"
  - "use labelOffsetX 100-200 px when connect labels collide with nodes"
common_hallucinations:
  - 'topology({ id, topic, groups: [...] }) — no groups property, declare via .group() chain'
  - '.group({ id, label }) — group takes (id, opts) positional, not single object'
  - '.add({ id, title }) — kind is required on TopologyContainer'
  - '.connect({ from, to, label }) — connect takes (from, to, opts) positional, not single object'
  - '.lane("client", { ... }) — no .lane method, use .group() instead'
```

:::

## Arguments

The arguments of `topology` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Diagram-wide identifier, unique within the page. |
| `topic` | `string` | Required | Title rendered at the top of the diagram. |
| `groupWidth` | `number` | Optional | Width of one group in px, default `460`. |
| `defaultTone` | `Tone` | Optional | Default color tone for every connect. |
| `defaultStyle` | `EdgeStyle` | Optional | Default line style for every connect. |

The arguments of `group` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Group identifier; containers stack inside at `stack` 0, 1, 2, .... |
| `label` | `string` | Required | Heading text shown at the top of the group. |

The fields of `TopologyContainer` (the `.add` argument) are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Container identifier, unique within the diagram. |
| `kind` | `NodeKind` | Required | Render kind (`frontend`, `service`, `database`, ...). |
| `title` | `string` | Required | Primary label shown inside the container. |
| `eyebrow` | `string` | Optional | Smaller label shown above the title. |

## Basic example

A complete example that assembles an AWS deployment diagram across three groups (the Client tier plus an AWS tier holding ALB, ECS, and RDS).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "AWS deployment"
type: topology

actors:
  - Browser: frontend
  - ALB: service
  - "ECS Task": service
  - RDS: database

flow:
  - Browser -> ALB: "HTTPS"
  - ALB -> "ECS Task": "round-robin"
  - "ECS Task" -> RDS: "TCP 5432" (success)
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: aws, topic: "AWS deployment" }
groups:
  - id: client
    label: Client
    contains:
      - { id: browser, kind: frontend, title: Browser }
  - id: aws
    label: AWS
    contains:
      - { id: alb, kind: service,  title: ALB,        eyebrow: "Load Balancer" }
      - { id: ecs, kind: service,  title: "ECS Task", eyebrow: Container }
      - { id: rds, kind: database, title: RDS,        eyebrow: Postgres }
connects:
  - { from: browser, to: alb, label: HTTPS,        sub: "TLS 1.3" }
  - { from: alb,     to: ecs, label: round-robin }
  - { from: ecs,     to: rds, label: "TCP 5432",   sub: pgbouncer, tone: success, labelOffsetX: 150 }
intent: two groups (Client / AWS) with ALB/ECS/RDS stacked inside AWS; cross-group connects auto-routed
```

:::

[preview:presets/topo-demo]

v0.5 Text DSL flattens the four actors into one row and wires them with three edges.
When you need `group` (a framed lane that stacks containers), `sub` (a secondary label), or `labelOffsetX` (the x-offset of the label), reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL cannot express `group` (vertical container stacking) or `connect.sub` / `connect.labelOffsetX`, so use the chain API below when you need a hierarchical topology.

The `topology` function signature and the builder interface are shown below.

```ts
topology({
  id: string;
  topic: string;
  groupWidth?: number;        // width of one group, default 460
  defaultTone?: Tone;
  defaultStyle?: EdgeStyle;
}): TopologyBuilder

interface TopologyBuilder {
  group(id: string, opts: { label: string }): TopologyGroupBuilder;
  connect(from: string, to: string, opts: TopologyConnection): TopologyBuilder;
  build(): CdlDiagram;
}

interface TopologyGroupBuilder {
  add(container: TopologyContainer): TopologyGroupBuilder;
}

interface TopologyContainer {
  id: string;
  kind: NodeKind;
  title: string;
  eyebrow?: string;
}
```

A complete usage example is shown below.

```ts
import { topology } from "@cardenelabs/cdl";

const aws = topology({ id: "aws", topic: "AWS deployment" });

aws
  .group("client", { label: "Client" })
    .add({ id: "browser", kind: "frontend", title: "Browser" });

aws
  .group("aws", { label: "AWS" })
    .add({ id: "alb", kind: "service",  title: "ALB",      eyebrow: "Load Balancer" })
    .add({ id: "ecs", kind: "service",  title: "ECS Task", eyebrow: "Container" })
    .add({ id: "rds", kind: "database", title: "RDS",      eyebrow: "Postgres" });

aws
  .connect("browser", "alb", { label: "HTTPS", sub: "TLS 1.3" })
  .connect("alb",     "ecs", { label: "round-robin" })
  .connect("ecs",     "rds", { label: "TCP 5432", sub: "pgbouncer", tone: "success", labelOffsetX: 150 });

export const awsDiagram = aws.build();
```

## The role of `group`

`.group(id, { label })` creates one contained (framed) lane.
Chaining `.add(...)` immediately afterward stacks nodes inside the same lane at `stack` 0, 1, 2, ....
The `label` of the group renders as the lane heading.

When you need to add containers later, call `.group(id, ...)` again with the same `id`.
The engine reuses the existing group and appends containers.

## Auto-routing in `connect`

`.connect(from, to, opts)` draws one edge.
Cross-group connections (such as `browser` -> `alb`, which references containers in different groups) are auto-routed by the engine.

`sub` (a secondary label) and `labelOffsetX` (the x-offset of the label in px) fine-tune label placement.
When a label collides with another node, sliding `labelOffsetX` by 100 to 200 px usually restores readability.

## Related

- [API Reference](/docs/en/cdl/reference/api#topology) is the canonical SSOT for type definitions.
- [swimlane preset](/docs/en/cdl/presets/swimlane) is the choice when you want a parallel workflow rather than an architecture diagram.
