# infrastructure preset

`infrastructure` is a high-level API for laying out cloud / system architecture diagrams (AWS / GCP / Azure, etc.) on a `col` (column) × `row` (row) grid.
It corresponds to mermaid `flowchart` box layouts.

You declare each `node` with its `kind` (cloud / service / database / cache / queue / cdn / backend, etc.) plus `col` and `row`, and use `connect` to draw the links.
Lanes are auto-generated per column, so a column-oriented architecture (Frontend → API → DB) can be expressed in the shortest possible form.

## When to use

`infrastructure` is great for showing the overview of a SaaS / web service / serverless architecture on a single page.

- Typical AWS / GCP topologies (CloudFront → ALB → ECS → RDS)
- Distributed systems with BFF / Lambda / queue / cache scattered around
- On-prem hybrid (DC + cloud) layouts split across columns

If you want a hierarchical layout with containers (groups), use [topology preset](/docs/en/cdl/presets/topology) instead.
`infrastructure` is dedicated to flat grid placement.

## Why a dedicated preset

With the low-level API you must declare a lane per column by hand. A six-column architecture spends six lines just on lane declarations.
`infrastructure` auto-creates the lane from the column number, so you only have to write `node` with its `col` and `row`.

> Compared to `topology`: `topology` visually wraps containers ("these three are in AWS") to emphasise membership. `infrastructure` has no membership; it places items on a column × row grid. When you do not need a hierarchy, the lighter `infrastructure` preset is the better fit.

## Signature

```ts
infrastructure({ id: string, topic: string, laneWidth?: number, defaultTone?: Tone, defaultStyle?: EdgeStyle })
  .node({ id, kind: NodeKind, title, col: number, row: number, subtitle?, eyebrow? })
  .connect({ from, to, label, sub?, tone?, style? })
  .build()
```

[preview:presets/infra-demo]

## Arguments

`infrastructure` accepts:

| arg | type | required | description |
|---|---|---|---|
| `id` | `string` | yes | identifier for the entire diagram |
| `topic` | `string` | yes | title rendered at the top |
| `laneWidth` | `number` | no | width of a single column in px (default `380`) |
| `defaultTone` | `Tone` | no | default tone for all `connect` calls |

`node` accepts:

| arg | type | required | description |
|---|---|---|---|
| `id` | `string` | yes | node id |
| `kind` | `NodeKind` | yes | cloud / service / database / cache / queue / cdn, etc. |
| `title` | `string` | yes | node label |
| `col` | `number` | yes | 0-indexed column (0 / 1 / 2 / ... from the left) |
| `row` | `number` | yes | 0-indexed row (stack within the same column) |
| `subtitle` | `string` | no | extra note |
| `eyebrow` | `string` | no | overline label |

`connect` requires `from` / `to` / `label`; `sub` / `tone` / `style` are optional.

## Complete example

```ts
import { infrastructure } from "@cardenelabs/cdl";

export const saasArch = infrastructure({ id: "saas", topic: "SaaS Architecture" })
  .node({ id: "user", kind: "person", title: "User", col: 0, row: 0 })
  .node({ id: "cdn", kind: "cdn", title: "CloudFront", col: 1, row: 0 })
  .node({ id: "alb", kind: "service", title: "ALB", col: 2, row: 0 })
  .node({ id: "app", kind: "service", title: "App", col: 2, row: 1 })
  .node({ id: "db", kind: "database", title: "RDS", col: 3, row: 0 })
  .node({ id: "cache", kind: "cache", title: "Redis", col: 3, row: 1 })
  .connect({ from: "user", to: "cdn", label: "HTTPS" })
  .connect({ from: "cdn", to: "alb", label: "origin" })
  .connect({ from: "alb", to: "app", label: "route" })
  .connect({ from: "app", to: "db", label: "SQL" })
  .connect({ from: "app", to: "cache", label: "GET/SET" })
  .build();
```

[preview:presets/infra-demo]

## See also

- [topology preset](/docs/en/cdl/presets/topology) — when you need groups + container nesting
- [network preset](/docs/en/cdl/presets/network) — router / switch / firewall + protocol labels for NW topologies
- [catalog presets page](/catalog/presets) — visual catalogue of every preset
