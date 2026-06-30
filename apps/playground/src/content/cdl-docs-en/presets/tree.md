# tree preset

`tree` is a high-level API that places a parent-child hierarchy on depth-based lanes.
It corresponds to mermaid `graph TD` hierarchical layouts.

By simply specifying `parent` on each `node`, the depth is auto-computed and the parent → child edge is drawn for you.
It fits one-way hierarchies such as org charts, file trees, category nesting, or class inheritance.

## When to use

`tree` works best when depth is 2-5 and you have 3-20 children.

- Org charts (CEO → CTO → Eng Manager → Engineer)
- File systems or project layouts (src → components → ui → Button)
- Category hierarchies (Electronics → Phone → iPhone)
- Class inheritance (Animal → Mammal → Dog)

If you have too many branches to fit in a column, switch to the radial layout of [mindMap preset](/docs/en/cdl/presets/mind).

## Why a dedicated preset

With the low-level API you would manually arrange lanes per depth and write every parent-child edge.
`tree` auto-computes depth from `parent` and generates edges automatically, so you only need to list the nodes.

> Compared to `mindMap`: `tree` arranges depth into vertical columns; `mindMap` radiates branches around a root. Use `tree` for clearly hierarchical structures, and `mindMap` for brainstorming.

## Signature

```ts
tree({ id: string, topic: string, nodeWidth?: number, defaultTone?: Tone })
  .node({ id, title, parent?, kind?, subtitle?, eyebrow? })
  .build()
```

[preview:presets/tree-demo]

## Arguments

| arg | type | required | description |
|---|---|---|---|
| `id` | `string` | yes | identifier |
| `topic` | `string` | yes | title |
| `nodeWidth` | `number` | no | per-node width in px (default `320`) |
| `defaultTone` | `Tone` | no | default tone for edges (default `accent`) |

`node`:

| arg | type | required | description |
|---|---|---|---|
| `id` | `string` | yes | node id |
| `title` | `string` | yes | node label |
| `parent` | `string` | no | parent id; root if omitted (depth 0) |
| `kind` | `NodeKind` | no | defaults to `card`, override with service / database / etc. |
| `subtitle` | `string` | no | extra note |
| `eyebrow` | `string` | no | overline label |

## Complete example

```ts
import { tree } from "@cardenelabs/cdl";

export const orgChart = tree({ id: "org", topic: "Organisation chart" })
  .node({ id: "ceo", title: "CEO" })
  .node({ id: "cto", title: "CTO", parent: "ceo" })
  .node({ id: "cfo", title: "CFO", parent: "ceo" })
  .node({ id: "eng", title: "Eng Manager", parent: "cto" })
  .node({ id: "ops", title: "Ops Manager", parent: "cto" })
  .build();
```

[preview:presets/tree-demo]

## See also

- [mindMap preset](/docs/en/cdl/presets/mind) — radial layout from a centre
- [classDiagram preset](/docs/en/cdl/presets/class) — for UML-style inheritance
- [catalog presets page](/catalog/presets)
