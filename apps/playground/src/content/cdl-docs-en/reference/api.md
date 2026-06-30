# API Reference (All APIs)

This is the **Reference** consolidating every public API that `@cardenelabs/cdl` exports into a single file.
It lists only function signatures, arguments, return values, and notes, keeping usage explanations to a minimum.

> This page is a **Reference**.
> If you want to "try it out", see [Quickstart](/docs/en/cdl/overview/quickstart).
> If you want to know "why it was designed this way", see [Overview](/docs/en/cdl/README).

## TOC

This page is long, so jump from the table of contents to the API you need.

- [Low-level API ... the `diagram()` builder](#low-level-api--the-diagram-builder)
  - [`.lane(id, opts)`](#laneid-opts)
  - [`.node(id, opts)` / `.nodes([...])`](#nodeid-opts--nodes)
  - [`.edge(from, to, opts)` / `.edges([...])`](#edgefrom-to-opts--edges)
  - [`.state(id, opts)`](#stateid-opts)
  - [`.phase(id, opts, build)`](#phaseid-opts-build)
  - [`.build()`](#build)
- [High-level API ... 6 presets (mermaid equivalent)](#high-level-api--6-presets-mermaid-equivalent)
  - [`sequence(...)`](#sequence)
  - [`er(...)`](#er)
  - [`stateMachine(...)`](#statemachine)
  - [`swimlane(...)`](#swimlane)
  - [`flow(...)`](#flow)
  - [`topology(...)`](#topology)
- [React rendering](#react-rendering)
- [validation / verifier API](#validation--verifier-api)
- [NodeKind list (29 kinds)](#nodekind-list-29-kinds)
- [Tone list](#tone-list)
- [EdgeStyle list](#edgestyle-list)
- [Related](#related)

## Low-level API ... the `diagram()` builder

This is the primitive API for assembling arbitrary lanes, nodes, edges, and phases.
It corresponds to mermaid's free-form notation and is used when you need fine-grained layout control.

The following signature returns a `DiagramBuilder`.
`id` is for internal references and `topic` is the string displayed in the header.

```ts
diagram(id: string, options: { topic: string }): DiagramBuilder
```

The returned `DiagramBuilder` exposes `.lane()`, `.node()`, `.edge()`, `.state()`, `.phase()`, and `.build()`.
Chain the methods below to assemble a diagram.

### `.lane(id, opts)`

This declares a single vertical column (lane).
It maps to actor columns in sequence diagrams, each lane in swimlanes, grouping in topologies, and similar layouts.

```ts
.lane(id: string, opts: {
  x: number;                  // viewport x position (px)
  width: number;              // width (px)
  label?: string;             // lane heading display
  contain?: boolean;          // true to draw a boundary frame
  lifeline?: boolean;         // true to draw a vertical dotted line at lane center (for sequence)
})
```

Setting `contain: true` draws a boundary box around the whole lane.
The sequence preset sets `lifeline: true` automatically on actor columns.

[preview:presets/seq-demo]

### `.node(id, opts)` / `.nodes([...])`

This declares a single node, or an array of nodes.
Choose whichever style you prefer — calling `node()` one at a time or passing them in bulk via `nodes([...])`.

```ts
.node(id: string, opts: {
  lane: string;               // parent lane id
  stack: number;              // vertical stack index (from 0)
  kind: NodeKind;             // visual kind (actor / function / storage / event / card / ...)
  title: string;
  subtitle?: string;
  eyebrow?: string;
  value?: string;             // value display for actor / storage ({stateId} interpolation OK)
  rows?: string[];            // storage rows ({stateId} interpolation OK)
  w?: number;                 // width override (default is fixed per kind)
  h?: number;                 // height override
})

// batch helper
.nodes(defs: Array<{ id: string } & Omit<CdlNode, "id">>)
```

Embedding a state id as `{stateId}` inside `value` or `rows` interpolates the animated value into the string.
For the available `kind` values, see the [NodeKind list](#nodekind-list-29-kinds).

[preview:presets/seq-demo]

### `.edge(from, to, opts)` / `.edges([...])`

This declares a single arrow (edge) or an array of arrows.
Pass node ids as `from` and `to`.

```ts
.edge(from: string, to: string, opts: {
  id?: string;                // auto-generated as `${from}-${to}` if omitted (numbered on duplicates)
  label: string;
  sub?: string;
  tone?: Tone;                // default "accent"
  side?: Side;                // top / bottom / left / right
  style?: EdgeStyle;          // solid (default) / dotted-flow
  labelOffsetX?: number;      // label fine-tuning
  labelOffsetY?: number;
  routing?: "default" | "back-detour";  // back-detour routes the path upward
})

// batch helper
.edges(defs: Array<...>)
```

If you omit `id`, it is auto-generated as `${from}-${to}`.
When the same pair appears multiple times, a numeric suffix is appended.

[preview:presets/seq-demo]

### `.state(id, opts)`

This declares a numeric or string state to interpolate during animation.
You change the value through `.tween()` and `.set()` inside phases.

```ts
.state(id: string, opts: {
  initial: number | string;   // initial value (at animation start)
})
```

`initial` is the value at the start of the animation.
Embedding `{stateId}` inside a node's `value` or `rows` shows the interpolated value on screen.

### `.phase(id, opts, build)`

This declares a single timeline stage (phase).
Writing multiple phases in sequence automatically produces a sequential animation.

```ts
.phase(id: string, opts: { duration?: number; title: string; body: string },
  build: (p: PhaseBuilder) => PhaseBuilder)

interface PhaseBuilder {
  activate(...ids: string[]): PhaseBuilder;        // active emphasis
  tween(stateId: string, from: number, to: number): PhaseBuilder;  // numeric linear interpolation
  set(stateId: string, value: number | string): PhaseBuilder;       // instant switch
  badge(text: string): PhaseBuilder;               // phase footer badge
}
```

Nodes and edges passed to `activate(...ids)` are emphasized only during that phase.
`tween()` does linear interpolation of numeric values, while `set()` switches instantly — the motion differs.

[preview:animation/tween-simple]

### `.build()`

Call this at the end of the builder chain to return an immutable `CdlDiagram`.
`validate()` runs internally and throws on failure.

```ts
.build(): CdlDiagram          // returns immutable diagram object after validate passes
```

You can pass the returned `CdlDiagram` directly to `<CdlDiagramView>` to render it.
The result is immutable after build, so to change it, build a fresh diagram from a new builder chain.

---

## High-level API ... 6 presets (mermaid equivalent)

We provide six presets corresponding to mermaid's diagram families.
Each compiles internally to the `diagram()` builder, so it is fully compatible with the low-level API.

| preset | mermaid equivalent | use case |
|---|---|---|
| `swimlane(...)` | flowchart LR with multiple lanes | actors working in parallel |
| `flow(...)` | flowchart TB | vertical processing flow |
| `sequence(...)` | sequenceDiagram | UML sequence (actor columns x timeline) |
| `topology(...)` | C4 / deployment | structure diagram (group + container) |
| `er(...)` | erDiagram | ER (entity + relation) |
| `stateMachine(...)` | stateDiagram-v2 | FSM (state + transition) |

### `sequence(...)`

This is the preset for UML sequence diagrams.
Pass actors as an array and arrange steps in time order.

```ts
sequence({
  id: string;
  topic: string;
  actors: string[];                  // arranged in the top header
  defaultTone?: Tone;
  defaultStyle?: EdgeStyle;
  laneWidth?: number;
})
  .step({ from, to, label, sub?, tone?, style? })
  .step({ ... })
  ...
  .build()
```

Each string in `actors` automatically becomes a labeled lane with a lifeline.
Step order maps directly to vertical order on screen.

[preview:presets/seq-demo]

### `er(...)`

This preset writes ER (entity-relationship) diagrams in a single function plus chain.
Declare rows per entity and specify cardinality with relations.

```ts
er({ id, topic, defaultTone? })
  .entity({ id, title, rows: ["id: PK", "email: string", ...] })
  .entity({ ... })
  .relation({ from, to, cardinality: "1:N", label?, tone? })
  .build()
```

`rows` is an array of `"column-name: type"` strings used as-is for display.
You can pass strings such as `"1:1"`, `"1:N"`, or `"N:M"` to `cardinality`.

### `stateMachine(...)`

This preset declares an FSM (finite state machine).
List states and write transition conditions.

```ts
stateMachine({ id, topic, stateWidth?, defaultTone? })
  .state({ id, title, initial?: true, final?: true })
  .transition({ from, to, trigger, guard?, tone? })
  .build()
```

The state with `initial: true` becomes the start node, and `final: true` marks the terminal state.
`trigger` is the transition label and `guard` displays as a sub-label.

### `swimlane(...)`

This preset places multiple lanes side by side and assigns nodes to each lane.
It expresses multiple actors working in parallel rather than a single actor column.

```ts
swimlane({ id, topic, lanes: ["Sender", "Contract", "Output"], laneWidth? })
  .laneId("Sender")                   // get slug
  .node(...).edge(...).phase(...)
  .build()
```

`laneId("Sender")` returns the internal slug, which you pass to the `lane` argument of subsequent `.node()` / `.edge()` calls.
The design lets you reference non-ASCII lane names safely.

### `flow(...)`

This preset writes a simple top-down process with a single lane in the shortest possible syntax.
Unlike sequence, it has only one actor column.

```ts
flow({ id, topic, laneLabel, defaultTone? })
  .step({ id, kind, title, eyebrow? }, transitionLabel?: string)
  .step({ ... }, "Next label")
  .build()
```

The second argument of `step(node, label)` specifies the transition label between the previous step and this one.
If you omit it, the steps are connected by a plain vertical arrow.

### `topology(...)`

This preset declares groups plus containers, similar to a cloud architecture diagram.
It corresponds to C4 or deployment diagrams.

```ts
topology({ id, topic, defaultTone? })
  .group("client", { label: "Client" })
    .add({ id: "browser", kind: "frontend", title: "Browser" })
  .group("aws", { label: "AWS" })
    .add({ id: "alb", kind: "service", title: "ALB", eyebrow: "Load Balancer" })
  .connect("browser", "alb", { label: "HTTPS", sub: "TLS 1.3" })
  .build()
```

Use `group()` to create logical boundaries and `add()` to drop containers inside them.
`connect()` draws communication lines between containers across groups.

[preview:presets/topo-demo]

---

## React rendering

These React components render the `CdlDiagram` returned by `build()` on the screen.
We export two variants — a normal playback view and a scaled-down static view.

```ts
import { CdlDiagramView, CdlDiagramThumbnail } from "@cardenelabs/cdl/react";

<CdlDiagramView diagram={d} hideHeader? />               // normal display
<CdlDiagramThumbnail diagram={d} hideHeader? />          // scaled-down static display
```

`CdlDiagramView` is the standard view that plays animations.
`CdlDiagramThumbnail` is a scaled-down static thumbnail for catalogs and listings.

---

## validation / verifier API

These functions invoke cdl's unique "eye" — the mechanism that matches author intent against the actual screen.
You get three routes (`validate` / `verifyDiagramDom` / `verifyAuthorIntent`) and can step from static checks to live-screen verification.

```ts
import {
  validate,                  // structural validation (duplicate id / undefined ref / required 0 count / etc.), throws on fail
  layout,                    // viewport coordinate calculation
  visualValidate,            // static 6 axes (overlap / clearance / alignment / ...)
  visualValidateAll,
  verifyAuthorIntent,        // author intent vs. actual screen (via Playwright)
  verifyAuthorIntentAll,
  verifyDiagramDom,          // engine self-consistency (via Playwright)
  verifyAllDiagramsDom,
} from "@cardenelabs/cdl";
```

`validate` throws synchronously, while `verifyAuthorIntent` and `verifyDiagramDom` are async functions that take a Playwright Page.
The [Verifier Guide](/docs/en/cdl/reference/verifier-guide) details how to choose among them.

[preview:animation/tween-simple]

---

## NodeKind list (29 kinds)

These are the visual kinds you can specify in `.node()`'s `kind`.
Categories are organized so that you can pick whichever matches your use case.

| Category | NodeKind |
|---|---|
| basic | actor / function / storage / event / card |
| people | person / user-group / admin / developer / external-user |
| infrastructure | database / cache / queue / message-bus / cloud / cdn |
| application | service / api / frontend / backend / webhook / microservice |
| data / control | signer / oracle / merkle-tree / decision |

You can visually inspect each NodeKind on the `/catalog/primitives` page.

## Tone list

These are the color themes you specify with an `.edge()` `tone` or a preset's `defaultTone`.
Out of six choices, accent is the default.

| Tone | hex | meaning |
|---|---|---|
| accent | `#c17f3e` | core action (default) |
| teal | `#4a8b7f` | data access |
| success | `#6b9e5a` | success / commit |
| warning | `#c9a23e` | warning / pending |
| error | `#c15a4a` | failure / revert |
| info | `#5a8ec1` | info / supplementary |

The meanings are recommendations, not enforcement.
If you want to unify your color theme, set `defaultTone` on the preset to apply it across the board.

---

## EdgeStyle list

This is the line style you specify with `.edge()`'s `style`.
Choose based on whether you want particles flowing during an animation.

| Style | use case |
|---|---|
| `"solid"` (default) | solid line + arrowhead |
| `"dotted-flow"` | dotted line + particle flow in active phase |

An edge with `"dotted-flow"` shows particles flowing along the dotted line only while it is targeted by a phase's `activate()`.
This is useful when you want to visualize data movement or asynchronous communication.

---

## Related

This section points you to the next docs.
Move on according to your situation.

- [Quickstart](/docs/en/cdl/overview/quickstart) ... if you want to run something in five minutes
- [Cookbook](/docs/en/cdl/overview/cookbook) ... if you want to copy real examples
- [Mermaid Migration](/docs/en/cdl/overview/mermaid-migration) ... if you are migrating from mermaid
- Existing `../diagram-authoring-api.md` / `../../packages/cdl/SPEC.md` ... internal specs
