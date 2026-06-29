# Quickstart ... draw an animated diagram in 5 steps

This tutorial walks you through cdl Text DSL v0.5 (a YAML-style declarative grammar) in five 5-minute steps.
Each step is self-contained, and finishing all five gives you a working knowledge of the six presets and the main animation features.

> 💡 **How this differs from mermaid** ... mermaid's `sequenceDiagram` emits a static SVG, while cdl returns a React component with particles (animated dots that travel along edges) flowing in time order. cdl follows a YAML-style notation that feels close to mermaid, so mermaid users pick it up in about ten minutes.

## Prerequisites

Before you start, confirm you have the following.

| What you need | How to check |
|---|---|
| Node.js 20+ and pnpm | `pnpm -v` shows 8.x or later |
| A React 19 project (Next.js, Vite, or Astro) | `react` in `package.json` is 19.x |
| TypeScript 5 | `tsconfig.json` has `strict: true` |

Install cdl and React peer dependencies first.

```bash
pnpm add @cardenelabs/cdl react react-dom
```

When `@cardenelabs/cdl` shows up under `dependencies` in `package.json`, you are ready.

## Step 1 ... your first diagram (2 actors + 1 arrow sequence)

Write the smallest sequence diagram in Text DSL.
It is a single step where User calls API.

```text
title: "Hello"
type: sequence

actors:
  - User
  - API

flow:
  - User -> API: "request"
```

[preview:presets/seq-demo]

Save the seven lines as `hello.cdl` and feed them to a React component to get a moving diagram.
From TypeScript, call it like this.

```ts
import { textDslToDiagram } from "@cardenelabs/cdl";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const hello = textDslToDiagram(`
title: "Hello"
type: sequence

actors:
  - User
  - API

flow:
  - User -> API: "request"
`);

export const App = () => <CdlDiagramView diagram={hello} />;
```

Four points matter.
`title:` is the header string shown above the diagram; values with non-ASCII characters must be wrapped in quotes (`" "`).
`type:` selects one of six presets (`sequence` / `flow` / `swimlane` / `er` / `state` / `topology`).
Under `actors:`, each `- User` line declares one actor.
Under `flow:`, each `- User -> API: "request"` line places one edge (arrow) in time order.

The left side of `->` is the source, the right side is the target, and the string after the colon is the label.
The arrow accepts `->`, `→`, or `=>` and normalizes them internally.

> 💡 **Why Text DSL** ... the TypeScript builder API (`diagram().lane().node().edge().build()`) gives you full type inference at the cost of verbosity. Text DSL is a thin YAML-style layer designed so that an LLM can generate it reliably and a non-engineer can read and write it.

The next step adds animation so values move with time.

[Next ... Step 2: add animation](#step-2--add-animation-state--tween)

## Step 2 ... add animation (state + tween)

Add animation (a time-driven motion effect) to the static diagram from Step 1.
The counter increments smoothly from 0 to 10.

```text
title: "Counter"
type: sequence

actors:
  - User
  - Counter: { kind: actor, value: "{count}" }

flow:
  - User -> Counter: "increment"

states:
  count: 0

animation:
  - step: "tap" 1.5s
    focus: [User, Counter]
    tween:
      count: 0 -> 10
    badge: "+10"
```

[preview:animation/tween-simple]

Two new blocks appear.
`states:` declares variables that animation will move (`count: 0` sets the initial value to 0).
Under `animation:`, you list `step:` entries and inside each step you write `focus` (which actors to highlight) and `tween` (a command that linearly interpolates a value).

On the `actors:` side, `Counter: { kind: actor, value: "{count}" }` uses an inline option (a single-line block of detail).
Embedding the placeholder `{count}` into `value:` makes Counter's display smoothly transition from 0 to 10 during animation.

`tween:` is a linear-interpolation command exclusive to numeric states.
The value is interpolated from `from` to `to` over the phase's duration (`1.5s` = 1500ms).

> 💡 **tween vs set** ... `tween` interpolates a numeric value linearly, producing a smooth animation. `set` instantly switches a numeric or string value (`status: "loading"` → `status: "done"`). Step 3 uses `set`.

Next we chain phases to express cumulative behavior.

[Next ... Step 3: multiple phases](#step-3--play-multiple-phases-in-sequence)

## Step 3 ... play multiple phases in sequence

When you list multiple phases, they play in order and let you express cumulative motion.
The counter goes 0 → 1 → 3 → 6 across three steps.

```text
title: "Sequential Counter"
type: sequence

actors:
  - User
  - Counter: { kind: actor, value: "{count}" }

flow:
  - User -> Counter: "+1"
  - User -> Counter: "+2"
  - User -> Counter: "+3"

states:
  count: 0

animation:
  - step: "+1" 1.0s
    focus: [Counter]
    tween:
      count: 0 -> 1
    badge: "1"

  - step: "+2" 1.0s
    focus: [Counter]
    tween:
      count: 1 -> 3
    badge: "3"

  - step: "+3" 1.0s
    focus: [Counter]
    tween:
      count: 3 -> 6
    badge: "6"
```

[preview:animation/tween-simple]

Listing three phases gives a 3-second total animation.
State (`count`) carries across phases, so phase 2's `from: 1` continues from phase 1's `to: 1`.

Here is a string-state example using `set`.
The status switches instantly through `idle` → `loading` → `done`.

```text
title: "Auth State"
type: flow

actors:
  - User
  - API: function

flow:
  - User -> API: "submit"

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [User, API]
    set:
      status: "loading"
    badge: "loading"

  - step: "done" 1.2s
    focus: [API]
    set:
      status: "done"
    badge: "done"
```

Swap `tween:` for `set:` to get instant string transitions.
You can `set` numbers too, but use `tween:` when you want smooth motion.

[Next ... Step 4: other presets](#step-4--try-the-other-presets)

## Step 4 ... try the other presets

`type:` accepts six presets.
Here is the purpose and a short example of each.

### `flow` ... single-column vertical flow

Stack nodes vertically.
Use this when you want to write a chain of steps top to bottom.

```text
title: "Order Flow"
type: flow

actors:
  - Cart
  - Checkout: function
  - Payment: service
  - Done

flow:
  - Cart -> Checkout: "submit"
  - Checkout -> Payment: "charge"
  - Payment -> Done: "ok" (success)
```

[preview:presets/flow-demo]

### `swimlane` ... horizontal lanes by role

Split into lanes (horizontal columns) per role (Sender / Contract / Receiver, etc.).
Equivalent to mermaid's `flowchart LR`.

```text
title: "ERC20 Transfer"
type: swimlane

actors:
  - Alice
  - "transfer()": function
  - Bob

flow:
  - Alice -> "transfer()": "call"
  - "transfer()" -> Bob: "emit" (success)
```

[preview:presets/swim-demo]

### `er` ... ER diagram (entity-relation)

Draw relations between database tables.
Equivalent to mermaid's `erDiagram`.

```text
title: "User-Order schema"
type: er

actors:
  - User: { kind: entity, rows: ["id: PK", "email: string", "createdAt: timestamp"] }
  - Order: { kind: entity, rows: ["id: PK", "userId: FK", "total: number"] }

flow:
  - User -> Order: "places" { cardinality: "1:N" }
```

[preview:presets/er-demo]

Specify `cardinality:` (1:1 / 1:N / N:M) through an inline option.
Each string in `rows:` is one column.

### `state` ... state machine

Draw states (Idle / Loading / Done / Error, etc.) and transitions.
Equivalent to mermaid's `stateDiagram-v2`.

```text
title: "Auth state"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }
  - Error: { kind: state }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)
  - Error -> Idle: "retry" { guard: "if attempts < 3" }
```

[preview:presets/fsm-demo]

`initial: true` marks the starting state; `final: true` marks the terminal state.
Pass `guard:` (a transition condition) as an inline option.

### `topology` ... system topology

Draw a system layout that spans several groups (Client / AWS / DB, etc.).
Equivalent to mermaid's C4-style diagrams.

```text
title: "AWS deployment"
type: topology

actors:
  - Browser
  - ALB: service
  - "ECS Task": service
  - RDS: database

flow:
  - Browser -> ALB: "HTTPS"
  - ALB -> "ECS Task": "round-robin"
  - "ECS Task" -> RDS: "TCP 5432" (success)
```

[preview:presets/topo-demo]

[Next ... Step 5: inline option](#step-5--control-details-with-inline-options)

## Step 5 ... control details with inline options

You have seen the presets and animation basics.
This step covers inline options (the `{ key: value, ... }` syntax that embeds detail into one line) for fine control.

### Actor inline options

The actor side accepts six options.

| option | Purpose | Example |
|---|---|---|
| `kind:` | Pick one of 29 visual kinds | `kind: storage` |
| `subtitle:` | Caption below the actor | `subtitle: "sender"` |
| `eyebrow:` | Small label above the actor | `eyebrow: "User"` |
| `value:` | Dynamic value placeholder | `value: "{count}"` |
| `rows:` | Row array (entity columns, etc.) | `rows: ["id: PK", "name: string"]` |
| `initial:` / `final:` | State start / end markers | `initial: true` |

```text
title: "Inline option demo"
type: sequence

actors:
  - Owner: { kind: actor, subtitle: "signature only (gas 0)" }
  - Spender: { kind: actor, eyebrow: "relayer" }
  - Counter: { kind: storage, value: "{balance}", rows: ["amt: {balance}"] }

flow:
  - Owner -> Spender: "send sig"
  - Spender -> Counter: "execute"

states:
  balance: 0

animation:
  - step: "execute" 1.5s
    focus: [Counter]
    tween:
      balance: 0 -> 100
    badge: "+100"
```

### Flow inline options

The flow side (edge) accepts five options.

| option | Purpose | Example |
|---|---|---|
| `sub:` | Caption below the label | `sub: "EIP-712 signature"` |
| `cardinality:` | ER-diagram cardinality | `cardinality: "1:N"` |
| `guard:` | State transition condition | `guard: "if attempts < 3"` |
| `labelOffsetX:` | X-axis label offset | `labelOffsetX: 150` |
| `labelOffsetY:` | Y-axis label offset | `labelOffsetY: -8` |

```text
title: "Edge inline option demo"
type: er

actors:
  - User: { kind: entity, rows: ["id: PK", "email: string"] }
  - Order: { kind: entity, rows: ["id: PK", "userId: FK", "total: number"] }

flow:
  - User -> Order: "places" { sub: "1 user owns many orders", cardinality: "1:N", labelOffsetY: -8 }
```

[preview:presets/er-demo]

### Tone and style via `(parens)`

The `(...)` suffix on a flow line lets you set tone (color) and style (line type) in one shot.

| Value | Kind | Effect |
|---|---|---|
| `success` | tone | Green (success response) |
| `error` | tone | Red (failure) |
| `warning` | tone | Yellow (warning) |
| `info` | tone | Blue (info) |
| `accent` | tone | Accent color |
| `teal` | tone | Auxiliary teal |
| `dotted-flow` | style | Dotted line with traveling particles |
| `solid` | style | Solid line |

```text
title: "Tone & style demo"
type: sequence

actors:
  - User
  - API: function
  - DB: storage

flow:
  - User -> API: "POST /login" (info)
  - API -> DB: "SELECT" (accent, dotted-flow)
  - DB -> API: "rows" (success)
  - API -> User: "200 OK" (success, dotted-flow)
```

[preview:presets/seq-demo]

Combine tone and style with a comma like `(success, dotted-flow)`.
Order does not matter; the parser detects each kind independently.

### Control canvas size with `viewport`

When a diagram is too large to fit one screen, declare `viewport` to set the canvas size.

```text
title: "Wide canvas"
type: sequence

viewport: { width: 1400, height: 900, laneWidth: 480, gap: 80 }

actors:
  - A
  - B

flow:
  - A -> B: "hello"
```

## Troubleshooting

### `Cannot find module '@cardenelabs/cdl'`

**Cause** ... the initial install did not finish, or the dependency cache is stale.

**Fix**:

```bash
pnpm install
pnpm add @cardenelabs/cdl
```

### `unknown type: "..."`

**Cause** ... `type:` received a string outside the six presets.

**Fix** ... use one of `sequence` / `flow` / `swimlane` / `er` / `state` / `topology`.

### `invalid actor entry: "..."`

**Cause** ... the actor inline option `{ ... }` has a colon (`:`) mismatch or unbalanced quote.

**Fix** ... wrap values containing non-ASCII text or whitespace in `"..."` and follow the `{ key: value, key: value }` form for inline options.

### `invalid flow entry: "..."`

**Cause** ... either side of `->` is empty, or a label quote is not closed.

**Fix**:

```diff
- - User -> : "request"
+ - User -> API: "request"
```

## Next steps

You now have hands-on knowledge of cdl Text DSL v0.5's main features.
Where you go next depends on your goal.

- Browse practical recipes ... [Cookbook](/docs/en/cdl/overview/cookbook) with 25 examples across DeFi / NFT / DAO / Bridge
- Look up the grammar ... [Text DSL Specification](/docs/en/cdl/text-dsl-spec) covers every construct
- Migrate from mermaid ... [Mermaid Migration](/docs/en/cdl/overview/mermaid-migration) with side-by-side conversions
- Have an LLM produce DSL ... [LLM Generation Guide](/docs/en/cdl/text-dsl-llm-guide)
