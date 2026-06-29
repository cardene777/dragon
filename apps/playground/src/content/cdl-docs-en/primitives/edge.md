# edge

`edge` is the primitive that expresses the relation between nodes as an arrow.
By combining `tone` (color), `style` (solid / dotted), and `label`, you express meaning such as a call, data access, success, or failure.
When you pass an edge id to a phase's `activate` target, the edge gets emphasized during that step.

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.edge(from: string, to: string, opts: {
  id?: string;                // when omitted, auto-generated as `${from}-${to}` (with a numeric suffix if duplicate)
  label: string;
  sub?: string;
  tone?: Tone;                // default "accent"
  side?: Side;                // top / bottom / left / right
  style?: EdgeStyle;          // solid (default) / dotted-flow
  labelOffsetX?: number;
  labelOffsetY?: number;
  routing?: "default" | "back-detour";
})
```

@@@ llm 🤖 For LLM

```yaml
fn: .edge
args:
  - name: from
    type: string
    required: true
    constraints:
      - "must reference an existing node id"
  - name: to
    type: string
    required: true
    constraints:
      - "must reference an existing node id, can equal from for self-loop"
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, optional: true, default: "${from}-${to}", hint: "auto numbering on duplicate" }
      label: { type: string, required: true, max: 32 }
      sub: { type: string, optional: true, max: 48, hint: "monospace 2nd line" }
      tone: { type: enum, optional: true, values: [accent, teal, success, warning, error, info], default: accent }
      side: { type: enum, optional: true, values: [top, bottom, left, right], hint: "auto-inferred when omitted" }
      style: { type: enum, optional: true, values: [solid, dotted-flow], default: solid }
      labelOffsetX: { type: number, optional: true, range: [-200, 200] }
      labelOffsetY: { type: number, optional: true, range: [-200, 200] }
      routing: { type: enum, optional: true, values: [default, back-detour], default: default }
returns: DiagramBuilder
typical_use:
  - "directional relation between two nodes (call / data flow / event emit)"
  - "tone-based semantic coloring (success / error / data access)"
  - "back transition with detour routing for state machines"
constraints:
  - "from / to must reference declared node ids"
  - "phase.activate referencing edge id requires the auto-generated or explicit id"
  - "label is mandatory even with tone / style override"
  - "routing: 'back-detour' is intended for reverse-direction edges only"
common_hallucinations:
  - '.edge({ from: ..., to: ..., label: ... }) — from / to are positional, opts is 3rd arg'
  - '.edge("a", "b", "call") — opts must be object with label key'
  - 'tone: "red" / "green" — tone is semantic enum, not color name'
  - 'style: "dashed" / "dotted" — only "solid" / "dotted-flow"'
  - 'arrow: "double" / "open" — no arrowhead option, derived from tone / style'
```

:::

[preview:styles/style-dotted-flow]

## Arguments

| Argument | Type | Required | Purpose |
|---|---|---|---|
| `from` | `string` | Required | ID of the source node |
| `to` | `string` | Required | ID of the target node |
| `id` | `string` | Optional | ID that identifies the edge. When omitted, auto-generated as `${from}-${to}` |
| `label` | `string` | Required | Main heading on the arrow (first line) |
| `sub` | `string` | Optional | Subtitle on the arrow (second line, monospace) |
| `tone` | `Tone` | Optional | Color (six values, default `accent`) |
| `side` | `Side` | Optional | Side of the node to connect to (`top` / `bottom` / `left` / `right`) |
| `style` | `EdgeStyle` | Optional | Line style (`solid` / `dotted-flow`, default `solid`) |
| `labelOffsetX` | `number` | Optional | Fine x adjustment for the label (px) |
| `labelOffsetY` | `number` | Optional | Fine y adjustment for the label (px) |
| `routing` | `"default" \| "back-detour"` | Optional | Path selection. Use `back-detour` to draw an arc upward |

## Return value

Returns the DiagramBuilder.
You can chain further calls to `.edge()` or `.phase()`.

## Design intent

> 💡 Why we separated tone and style
> Edge meaning decomposes into two axes — "what is the arrow for (color)" and "synchronous or asynchronous (line style)."
> By specifying meaning (success / failure / data access) with `tone` and time characteristics (instant / flowing) with `style` independently, six tones times two styles equals twelve combinations cover every relation.
> We did not split into per-purpose APIs (`.successEdge()` / `.dataEdge()`); a single API gives you full combinational freedom by design.

## Basics

The minimal code specifies `from` / `to` / `label`.
`id`, `tone`, and `style` all have automatic defaults, so you can omit them.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "minimal call"
type: sequence

actors:
  - Alice
  - greet: function

flow:
  - Alice -> greet: "call"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: alice, to: greet, label: call }
    # auto id: alice-greet, tone default: accent, style default: solid
intent: minimal 3 fields (from / to / label); the rest default and can be omitted
```

:::

In this example, an accent-colored (orange) solid arrow connects `Alice` to `greet`, with the `call` label shown at the center.

## Batch declaration

In v0.5 Text DSL, listing entries under `flow:` is itself a batch declaration.
In the chain API, `.edges()` accepts an array where each entry takes the same options as `.edge()`.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "round-trip"
type: sequence

actors:
  - a
  - b
  - c

flow:
  - a -> b: "call"
  - b -> c: "ack" (success)
  - c -> a: "done" (info)
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: call }
  - { from: b, to: c, label: ack,  tone: success }
  - { from: c, to: a, label: done, tone: info }
intent: batch declaration keeps the chain readable (avoids stacking individual .edge() calls)
```

:::

[preview:styles/style-dotted-flow]

## The six tone values

Pick `tone` from the following six values.
When you keep the color consistent with each meaning, the whole diagram earns a visual contract such as "green for success, red for failure."

| Tone | hex | Meaning |
|---|---|---|
| `accent` (default) | `#c17f3e` | Central action |
| `teal` | `#4a8b7f` | Data access |
| `success` | `#6b9e5a` | Success / commit |
| `warning` | `#c9a23e` | Warning / pending |
| `error` | `#c15a4a` | Failure / revert |
| `info` | `#5a8ec1` | Information / supplement |

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "tone palette"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "save"
  - a -> b: "fail" (error)
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: save, tone: teal }   # data access
  - { from: a, to: b, label: fail, tone: error }  # failure
tones:
  - { value: accent,  hex: "#c17f3e", meaning: central action }
  - { value: teal,    hex: "#4a8b7f", meaning: data access }
  - { value: success, hex: "#6b9e5a", meaning: "success / commit" }
  - { value: warning, hex: "#c9a23e", meaning: "warning / pending" }
  - { value: error,   hex: "#c15a4a", meaning: "failure / revert" }
  - { value: info,    hex: "#5a8ec1", meaning: "information / supplement" }
intent: tone is a semantic enum of meaning (do not write a raw color name)
```

:::

You can preview every tone at [`/catalog/styles`](/catalog/styles).

## The two EdgeStyle values

Pick `style` from the following two values.
When you want to express dynamic motion, use `dotted-flow`.

| Style | Description | Purpose |
|---|---|---|
| `solid` (default) | Solid line plus arrow head | Direct call |
| `dotted-flow` | Dotted line plus particles (triple glow) that flow during the active phase | Data flow / asynchronous / pass-through |

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "sync vs async"
type: sequence

actors:
  - a
  - b
  - c

flow:
  - a -> b: "call"
  - b -> c: "emit"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: call, style: solid }         # call (synchronous)
  - { from: b, to: c, label: emit, style: dotted-flow }   # event notification (asynchronous)
styles:
  - { value: solid,        usage: "direct call",                                    appearance: "solid line + arrow head" }
  - { value: dotted-flow,  usage: "data flow / asynchronous / pass-through",        appearance: "dotted line + triple-glow particles flowing during active phase" }
intent: style expresses time characteristics (sync / async); orthogonal to tone (meaning)
```

:::

## label / sub display

The text shown at the center of the arrow uses a two-tier structure with `label` (primary) and `sub` (secondary).
When you want to split a primary action from its details, such as a SQL query, use `sub`.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "SQL query"
type: sequence

actors:
  - api: function
  - db: database

flow:
  - api -> db: "SELECT"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - from: api
    to: db
    label: SELECT            # primary label (first line, 17 px bold)
    sub: "WHERE id = $1"     # secondary label (second line, 15 px monospace)
intent: render primary action + detail in two tiers (SQL query / RPC method args / etc.)
```

:::

v0.5 Text DSL cannot express the sub label (secondary label). Use the chain API's `sub` field for detailed display.

## Fine label position adjustment

Where multiple edges crowd together, labels may overlap.
You can adjust the position in pixels with `labelOffsetX` / `labelOffsetY` (positive values move the label right / down).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "label offset"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "x"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: x, labelOffsetX: 80, labelOffsetY: -40 }
intent: manually nudge the label to avoid overlap (positive = right / down, negative = left / up, range -200..+200)
```

:::

v0.5 Text DSL cannot express `labelOffsetX` / `labelOffsetY` directly. Use the chain API when fine adjustment is required.

## routing (upward detour)

When a reverse edge such as a state machine back transition overlaps the forward path, the lines collide.
When you specify `routing: "back-detour"`, the path switches to a large arc drawn upward.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "retry loop"
type: state

actors:
  - idle
  - error

flow:
  - idle -> error: "fail"
  - error -> idle: "retry"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: error, to: idle, label: retry, routing: back-detour }
intent: upward-arc detour for a reverse edge that would collide with the forward path
note: stateMachine preset sets this automatically for back transitions; only declare it when you build the diagram manually
```

:::

In v0.5 Text DSL, the `type: state` path detects back transitions automatically and applies the upward detour.
Use the chain API to set `routing: "back-detour"` only when you build a diagram manually without going through a preset.

## side (connection side)

Specify with `top` / `bottom` / `left` / `right` which side of the node the edge connects to.
When you omit it, the side is inferred automatically from the position of `from` and `to`.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "top connect"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "x"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: x, side: top }    # top of a -> top of b
intent: pin the connection side explicitly; default infers it from the from / to relative position
```

:::

v0.5 Text DSL cannot express `side` directly; use the chain API when the default auto-inference is insufficient.

## edge auto id behavior

When you omit `id`, it is auto-generated as `${from}-${to}`, and when multiple edges share the same from-to pair, a numeric suffix is added.
When you reference an edge from `phase.activate`, pass the generated ID.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "duplicate edges"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "step 1"
  - a -> b: "step 2"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: "step 1" }   # auto id: a-b
  - { from: a, to: b, label: "step 2" }   # auto id: a-b-2 (numeric suffix)
intent: omitting id auto-generates ${from}-${to}; duplicates get -2 / -3 numeric suffixes
```

:::

When you activate the edge in a phase, use the generated id.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "phase activate edge"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "call"

animation:
  - step: "call" 1.2s
    focus: [a, b]
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: p
    activates: [a, b, a-b]   # node a + node b + edge a-b (auto id)
intent: phase.activate is variadic and accepts node / edge / phase ids (pass the edge auto id explicitly)
```

:::

In v0.5 Text DSL, the `focus` field enumerates node ids only, and edges connecting focused nodes activate automatically during the phase.

## API Reference (chain API)

Use the builder API for cases v0.5 Text DSL cannot express, such as per-edge `tone` precision (some values), `sub`, `labelOffsetX` / `labelOffsetY`, `side`, or `routing`.

```ts
.edge("alice", "greet", { label: "call" })
// auto id: "alice-greet", tone default: "accent", style default: "solid"

.edges([
  { from: "a", to: "b", label: "call" },
  { from: "b", to: "c", label: "ack",  tone: "success" },
  { from: "c", to: "a", label: "done", tone: "info" },
])

.edge("a", "b", { label: "save", tone: "teal" })       // data access
.edge("a", "b", { label: "fail", tone: "error" })      // failure

.edge("a", "b", { label: "call", style: "solid" })          // call
.edge("b", "c", { label: "emit", style: "dotted-flow" })    // event notification

.edge("api", "db", {
  label: "SELECT",            // primary label (first line, 17 px bold)
  sub: "WHERE id = $1",       // secondary label (second line, 15 px monospace)
})

.edge("a", "b", { label: "x", labelOffsetX: 80,  labelOffsetY: -40 })

.edge("error", "idle", { label: "retry", routing: "back-detour" })

.edge("a", "b", { label: "x", side: "top" })   // top of a -> top of b (top-top routing)

.edges([
  { from: "a", to: "b", label: "step 1" },  // id: "a-b"
  { from: "a", to: "b", label: "step 2" },  // id: "a-b-2"
])

.activate("a", "b", "a-b")
```

## Related

- [node](/docs/en/cdl/primitives/node) — specified at the edge's `from` / `to`
- [phase](/docs/en/cdl/primitives/phase) — declares the step that activates the edge
- [API Reference](/docs/en/cdl/reference/api#edge) — type definitions for every field
