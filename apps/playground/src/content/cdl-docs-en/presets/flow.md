# flow preset

The `flow` preset is a high-level API that stacks `step` items (units of work) vertically inside a single lane (column) and auto-wires an edge (arrow) from every step to the next.
It corresponds to a mermaid `flowchart TB` (top-to-bottom flowchart) flowing downward.

You chain steps with the builder, and the engine handles the `stack` order and the edge between successive steps.
The preset is designed to express a straight-line process inside one actor or one system with the shortest possible declaration.

## When to use it

`flow` is ideal for a single-lane workflow that flows from top to bottom in one straight line.
When there is no branching or parallelism, this preset minimizes the declaration.

- You want a vertical sequential workflow.
- You want to describe a process inside one actor or one system.
- You have a straight-line set of steps such as an auth flow, an approval flow, or a pipeline.

## When not to use it

Pick a different preset when the workflow has parallelism or branching.
Forcing those shapes through `flow` only multiplies lanes and tangles the declaration.

- For actors running in parallel, pick the [swimlane preset](/docs/en/cdl/presets/swimlane).
- For UML sequence diagrams (round-trip messages over time), pick the [sequence preset](/docs/en/cdl/presets/sequence).
- For branching (conditional transitions), pick the [stateMachine preset](/docs/en/cdl/presets/state-machine).

## Why split this preset

You can stack a single lane with the low-level API, but each step requires separate `node` and `edge` declarations, so a five-step flow already exceeds 10 lines.
The `flow` preset bakes in "every new step auto-generates an edge from the previous step" so the same diagram fits in fewer than half the lines.

> Difference from mermaid: mermaid `flowchart TB` requires `A --> B` for every arrow, while cdl `flow` chains `.step(...)` calls and auto-wires the arrow from the previous step.

## Signature

::: tabs

@@@ humans 👤 For humans

A flow diagram in v0.5 Text DSL uses `type: flow`, lists nodes top-to-bottom in `actors`, and writes the inter-step label inside each flow line.

```text
title: "<diagram topic>"
type: flow

actors:
  - <Node 1>: <kind>
  - <Node 2>: <kind>
  - <Node 3>: <kind>

flow:
  - <Node 1> -> <Node 2>: "<inter-step label>"
  - <Node 2> -> <Node 3>: "<inter-step label>"
```

[preview:presets/flow-demo]

The declaration order of `actors` becomes the top-to-bottom order on the canvas, and each `flow` line's label becomes the label on the arrow from the previous step.
v0.5 Text DSL cannot express the chain API's `transitionLabel` (second argument), `eyebrow` (secondary label), or `laneLabel` (lane heading); see the "API Reference (chain API)" section at the bottom of this page when you need any of those.

@@@ llm 🤖 For LLM

```yaml
fn: flow(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      laneLabel: { type: string, required: true, max: 24, hint: "heading shown at the top of the single lane" }
      laneWidth: { type: number, optional: true, hint: "width of the single lane in px" }
      defaultTone: { type: Tone, optional: true }
      defaultStyle: { type: EdgeStyle, optional: true }
returns: FlowBuilder { step, build }
typical_use:
  - "vertical sequential workflow inside one actor or system"
  - "auth flow / approval flow / pipeline declared as a straight line"
  - "single-lane workflow without branching or parallelism"
constraints:
  - "step takes (input, transitionLabel?), transitionLabel is 2nd positional arg, not a property"
  - "transitionLabel on the first step is ignored (no previous step to connect from)"
  - "edge between steps is auto-generated, do not declare it manually with .edge"
  - "for branching or return transitions, switch to stateMachine preset"
common_hallucinations:
  - '.step({ id, kind, title, transitionLabel: "..." }) — transitionLabel is 2nd arg, not a property of input'
  - 'flow(id, topic, laneLabel) — opts must be a single object'
  - '.step({ id, title }) — kind is required, do not omit'
  - '.edge({ from, to, label }) — do not declare edges manually, use transitionLabel instead'
  - '.branch({ ... }) — no branch API, use stateMachine preset for branches'
```

:::

## Arguments

The arguments of `flow` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Diagram-wide identifier, unique within the page. |
| `topic` | `string` | Required | Title rendered at the top of the diagram. |
| `laneLabel` | `string` | Required | Heading text shown at the top of the single lane. |
| `defaultTone` | `Tone` | Optional | Default color tone for every step. |

The arguments of `step` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Node identifier, unique within the diagram. |
| `kind` | `NodeKind` | Required | Render kind (`person`, `api`, `service`, `database`, ...). |
| `title` | `string` | Required | Primary label shown inside the node. |
| `eyebrow` | `string` | Optional | Smaller label shown above the title. |
| `transitionLabel` | `string` | Optional | Label on the arrow from the previous step (second argument of `step`). |

## Basic example

A complete example that assembles a four-step auth flow with `flow`.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Auth Flow"
type: flow

actors:
  - User: person
  - "POST /login": api
  - AuthService: service
  - "users table": database

flow:
  - User -> "POST /login": "login request"
  - "POST /login" -> AuthService: "authenticate"
  - AuthService -> "users table": "verify credential"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: auth, topic: Auth Flow, laneLabel: Authentication }
steps:
  - { id: user, kind: person,   title: User,          eyebrow: "End User" }
  - { id: api,  kind: api,      title: "POST /login", eyebrow: API,        transition: "login request" }
  - { id: auth, kind: service,  title: AuthService,   eyebrow: Service,    transition: authenticate }
  - { id: db,   kind: database, title: "users table", eyebrow: DB,         transition: "verify credential" }
intent: four nodes stacked top-to-bottom in a single lane, edges auto-wired by transition labels
```

:::

[preview:presets/flow-demo]

The code centers a single lane and stacks four nodes from top to bottom in the order `User`, `POST /login`, `AuthService`, `users table`.
Each flow line carries an edge label (`"login request"`, `"authenticate"`, `"verify credential"`), and the engine draws those labels on the arrow from the previous node.

v0.5 Text DSL cannot declare `eyebrow` (the secondary label) or `laneLabel` (the lane heading).
Reach for the chain API below when you need either.

## API Reference (chain API)

v0.5 Text DSL cannot express `eyebrow`, `laneLabel`, or the positional `transitionLabel` second argument, so use the chain API below when you need detailed control.

The `flow` function signature and the builder interface are shown below.

```ts
flow({
  id: string;
  topic: string;
  laneLabel: string;
  defaultTone?: Tone;
}): FlowBuilder

interface FlowBuilder {
  step(input: FlowStepInput, transitionLabel?: string): FlowBuilder;
  build(): CdlDiagram;
}

interface FlowStepInput {
  id: string;
  kind: NodeKind;
  title: string;
  eyebrow?: string;
}
```

A complete usage example is shown below.

```ts
import { flow } from "@cardenelabs/cdl";

const auth = flow({ id: "auth", topic: "Auth Flow", laneLabel: "Authentication" })
  .step({ id: "user", kind: "person",   title: "User",        eyebrow: "End User" })
  .step({ id: "api",  kind: "api",      title: "POST /login", eyebrow: "API" }, "login request")
  .step({ id: "auth", kind: "service",  title: "AuthService", eyebrow: "Service" }, "authenticate")
  .step({ id: "db",   kind: "database", title: "users table", eyebrow: "DB" }, "verify credential")
  .build();
```

## Related

- [API Reference](/docs/en/cdl/reference/api#flow) is the canonical SSOT for type definitions.
- [swimlane preset](/docs/en/cdl/presets/swimlane) is the choice when you have parallel lanes.
- [stateMachine preset](/docs/en/cdl/presets/state-machine) is the choice when you have branches or return transitions.
