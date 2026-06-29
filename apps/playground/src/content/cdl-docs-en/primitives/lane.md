# lane

`lane` is the primitive that represents a horizontal partition (column) in a diagram.
You use it as the unit that groups actors, system boundaries, or categories into a single column.
For each column you specify an `x` position and a `width`, and you place `node`s vertically inside the column.

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.lane(id: string, opts: {
  x: number;              // viewport x position (px)
  width: number;          // width (px)
  label?: string;         // column heading
  contain?: boolean;      // true to draw a boundary frame
  lifeline?: boolean;     // true to draw a vertical dotted line at the lane center (UML sequence)
})
```

@@@ llm 🤖 For LLM

```yaml
fn: .lane
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
  - name: opts
    type: object
    required: true
    properties:
      x: { type: number, range: [0, 2400], hint: "multiples of 20" }
      width: { type: number, range: [200, 800] }
      label: { type: string, optional: true, max: 24 }
      contain: { type: boolean, optional: true, default: false }
      lifeline: { type: boolean, optional: true, default: false }
returns: DiagramBuilder
typical_use:
  - "horizontal partition (column) for grouping nodes"
  - "system boundary or category visualization"
constraints:
  - "contain: true + lifeline: true is mutually exclusive"
  - "contain: true requires at least 1 child node"
common_hallucinations:
  - '.lane({ id: ..., x: ... }) — opts is 2nd arg, not 1st'
  - '.lane("u", 0, 320) — opts must be object'
  - 'opts.lane — not a property'
```

:::

[preview:primitives/lane-contain]

## Arguments

| Argument | Type | Required | Purpose |
|---|---|---|---|
| `id` | `string` | Required | Unique ID that identifies the lane. Referenced from the `lane` field of `node` |
| `x` | `number` | Required | X coordinate on the viewport (px) |
| `width` | `number` | Required | Column width (px) |
| `label` | `string` | Optional | Heading displayed at the top of the column |
| `contain` | `boolean` | Optional | Set to `true` to wrap the whole column in a dashed frame (expresses a system boundary) |
| `lifeline` | `boolean` | Optional | Set to `true` to draw a vertical dotted line through the column center (lifeline for UML sequence) |

## Return value

Returns the DiagramBuilder.
You can chain further calls to `.lane()` or `.node()`.

## Design intent

> 💡 Why `lane` exists as an independent primitive
> In diagrams that line up multiple actors such as swimlane or sequence, you must explicitly reserve a "vertical space" for each actor.
> By separating `lane` as a primitive, you can repurpose it for any meaning — actor columns, system boundaries, responsibility splits, external / internal divisions — and not just actor columns.
> We exposed `x` and `width` directly on the API so that the higher-level preset (`swimlane()`) can compute them automatically while the option of manual placement stays open.

## Basics

The minimal code lines up two columns with `x` and `width`.
Leave an 80-120 px gap between columns so edge labels stay readable.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Example"
type: swimlane

actors:
  - left
  - right
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: ex, topic: Example }
lanes:
  - { id: left,  x: 0,   width: 320 }
  - { id: right, x: 460, width: 320 }
intent: place 2 columns via explicit x / width, gap = 460 - 320 = 140 px (edge label readability threshold)
```

:::

In this example, the `left` and `right` columns line up horizontally as a 2-lane swimlane.
In v0.5 Text DSL, the preset computes `x` and `width` automatically, so declaring actors alone completes the two-column composition.

## contain (boundary frame)

When you pass `contain: true`, the column is wrapped in a dashed frame.
Use it to express cloud boundaries (AWS / GCP and so on) or the responsibility range of a microservice.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "AWS Boundary"
type: topology

actors:
  - aws: cloud
```

@@@ llm 🤖 For LLM

```yaml
lanes:
  - { id: aws, x: 540, width: 460, label: AWS, contain: true }
intent: wrap a column in a dashed frame to express a system boundary (cloud / microservice scope)
```

:::

[preview:primitives/lane-contain]

In v0.5 Text DSL, the `topology` preset or an actor declared with `kind: cloud` automatically draws the system boundary.
A lane with `contain: true` from the chain API expands its height to cover every internal node, and the frame is rendered in the neumorphism style (dashed border plus a subtle fill).

## lifeline (for UML sequence)

When you pass `lifeline: true`, a vertical dotted line is drawn through the lane center.
This expresses the lifeline of a UML sequence diagram (the vertical line that shows the actor's lifespan).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "User Lifeline"
type: sequence

actors:
  - User
```

@@@ llm 🤖 For LLM

```yaml
lanes:
  - { id: user, width: 220, label: User, lifeline: true }
intent: draw a UML sequence lifeline (vertical dotted line for actor lifespan) at the lane center
note: sequence preset sets this automatically; only declare it when you build the diagram manually
```

:::

In v0.5 Text DSL, the `type: sequence` path sets `lifeline: true` internally, so you usually do not need to think about this flag.
Use the chain API only when you build a sequence-style diagram manually without going through a preset.

## Placement guideline

When you specify `x` and `width` manually, the recommended values by column count are as follows.
The table assumes a viewport width of 1400 px and a column gap of 80-120 px.

| Purpose | x / width recommendation |
|---|---|
| 2 lanes | `(0, 400)` / `(500, 400)` |
| 3 lanes | `(0, 320)` / `(440, 380)` / `(900, 320)` |
| 4 lanes | `(0, 280)` / `(380, 280)` / `(760, 280)` / `(1140, 280)` |

## auto-layout path

If you do not want to compute `x` and `width` by hand, use the `swimlane` preset.
With `type: swimlane`, listing actors auto-computes `x` and `width` from the lane count.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "3-lane swimlane"
type: swimlane

actors:
  - client
  - api: function
  - db: storage
```

@@@ llm 🤖 For LLM

```yaml
preset: swimlane
lanes: [client, api, db]
intent: a higher-level preset computes x / width automatically from the lane count (no manual placement)
note: viewport 1400 px assumed; 3 lanes resolve to (0, 320) / (440, 380) / (900, 320) equivalent
```

:::

See the [swimlane preset](/docs/en/cdl/presets/swimlane) for details.

## API Reference (chain API)

Use the builder API directly when you need fine-grained options such as `contain` / `lifeline` that v0.5 Text DSL cannot express.

```ts
diagram("ex", { topic: "Example" })
  .lane("left",  { x: 0,   width: 320 })
  .lane("right", { x: 460, width: 320 })

.lane("aws", { x: 540, width: 460, label: "AWS", contain: true })

.lane("user", { width: 220, label: "User", lifeline: true })

swimlane({ lanes: ["client", "api", "db"] })
  .node(...).edge(...).build()
```

## Related

- [node](/docs/en/cdl/primitives/node) — individual parts that belong to a lane
- [swimlane preset](/docs/en/cdl/presets/swimlane) — higher-level API that declares multiple lanes on a single line
- [API Reference](/docs/en/cdl/reference/api#lane) — type definitions for every field
