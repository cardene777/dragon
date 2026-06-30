# swimlane preset

The `swimlane` preset is a high-level API that declares horizontally arranged `lane` columns from a single array of lane names.
You pass a string array of lane labels, and the engine auto-computes each lane's `x` coordinate, width, and label slug.

Conceptually it is equivalent to placing multiple `subgraph` blocks side by side under a mermaid `flowchart LR`.
The preset is tuned for putting parallel actors or systems on a single canvas.

## When to use it

`swimlane` is ideal when distinct roles or systems sit side by side across the canvas.
Reach for it on medium-size flows of three to five lanes when you do not want to compute lane `x` and `width` by hand.

- You want a diagram with distinct roles or systems lined up horizontally.
- You want a medium flow of roughly three to five lanes on one page.
- You do not want to compute lane `x` and `width` manually.

What a mermaid `flowchart LR` expresses through parallel `subgraph` blocks, cdl expresses through one array.

## When not to use it

Reach for a different preset when the diagram has a single lane or when time is the protagonist.
Forcing those shapes through `swimlane` collapses to one lane and erases the preset's benefits.

- For a single-lane vertical workflow, pick the [flow preset](/docs/en/cdl/presets/flow).
- For UML sequence diagrams with round-trip messages over time, pick the [sequence preset](/docs/en/cdl/presets/sequence).
- For system architecture diagrams, pick the [topology preset](/docs/en/cdl/presets/topology).

## Why split this preset

Building a three-lane diagram through the low-level API (`primitives` with one `lane` declaration at a time) forces you to compute `x`, `width`, and label slug for every lane, and the lane declarations alone exceed 10 lines.
The `swimlane` preset compresses that work into a one-line array of lane names, and the engine adjusts the lane gap and label clearance for you.

> Difference from mermaid: mermaid `flowchart LR` plus `subgraph` lets the engine size each subgraph, but you still hand-place the nodes inside. cdl `swimlane` also normalizes lane ids (slugs) and labels that contain non-ASCII characters, on top of computing lane.x and width.

## Signature

::: tabs

@@@ humans 👤 For humans

A swimlane diagram in v0.5 Text DSL uses `type: swimlane`, lists each lane in `actors`, and writes inter-lane arrows in `flow`.

```text
title: "<diagram topic>"
type: swimlane

actors:
  - <Lane 1>
  - <Lane 2>: <kind>
  - <Lane 3>

flow:
  - <Lane 1> -> <Lane 2>: "<label>"
  - <Lane 2> -> <Lane 3>: "<label>" (<tone>, <style>)
```

[preview:presets/swim-demo]

v0.5 Text DSL keeps one actor per lane, and the engine computes lane `x`, `laneWidth`, and `contain` (frame) automatically.
When you want multiple nodes stacked inside one lane, see the "API Reference (chain API)" section at the bottom of this page.

@@@ llm 🤖 For LLM

```yaml
fn: swimlane(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      lanes: { type: "string[]", required: true, hint: "2-5 lanes recommended, order = left-to-right, can contain non-ASCII" }
      laneWidth: { type: number, optional: true, default: 400, range: [240, 720] }
      contain: { type: boolean, optional: true, default: false, hint: "wrap entire lane group in a frame" }
returns: SwimlaneResult (DiagramBuilder + laneId(indexOrLabel) getter)
typical_use:
  - "parallel actors or systems lined up horizontally on one canvas"
  - "medium-size flow with 3-5 distinct roles or systems"
  - "diagrams where you do not want to compute lane.x / lane.width by hand"
constraints:
  - "lanes are labels, not ids - use .laneId('label') to get the internal slug"
  - "after swimlane(), use low-level .node() / .edges() / .phase() to populate"
  - "node.lane must reference the slug returned by laneId(), not the raw label"
  - "contain frames the entire lane group as one container, not each lane individually"
common_hallucinations:
  - 'swimlane({ lanes: [{ id: "a", label: "A" }] }) — lanes is string[], not object array'
  - '.lane("a", { ... }) — swimlane already declares lanes, do not call .lane again'
  - '.node("x", { lane: "Sender" }) — lane field must be slug from laneId(), not raw label'
  - 'swimlane(id, topic, lanes) — opts must be a single object'
  - '.step({ ... }) — no step method, use low-level .node() / .edges()'
```

:::

## Arguments

The arguments of `swimlane` are listed below.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Required | Diagram-wide identifier, unique within the page. |
| `topic` | `string` | Required | Title rendered at the top of the diagram. |
| `lanes` | `string[]` | Required | Lane labels along the top edge; array order = left-to-right ordering. |
| `laneWidth` | `number` | Optional | Width of one lane in px, default `400`. |
| `contain` | `boolean` | Optional | When `true`, draws every lane wrapped in a container frame. |

## Basic example

A complete example that builds an ERC20 transfer flow across three lanes (`Sender`, `Contract`, `Receiver`).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "ERC20 Transfer"
type: swimlane

actors:
  - Client
  - "transfer()": function
  - Server

flow:
  - Client -> "transfer()": "call"
  - "transfer()" -> Server: "emit" (success, dotted-flow)

animation:
  - step: "call" 1.5s
    focus: [Client, "transfer()"]
    badge: "call"

  - step: "emit" 1.5s
    focus: ["transfer()", Server]
    badge: "emit"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: transfer, topic: "ERC20 Transfer" }
lanes: [Sender, Contract, Receiver]
nodes:
  - { id: client, lane: Sender,   stack: 0, kind: actor,    title: Client }
  - { id: fn,    lane: Contract, stack: 0, kind: function, title: "transfer()" }
  - { id: server,   lane: Receiver, stack: 0, kind: actor,    title: Server }
edges:
  - { from: client, to: fn,  label: call }
  - { from: fn,    to: server, label: emit, tone: success, style: dotted-flow }
phases:
  - { id: call, duration_ms: 1500, title: call, body: "Client calls transfer.", activates: [client, fn, client-fn] }
  - { id: emit, duration_ms: 1500, title: emit, body: "Notify Server.",           activates: [fn, server, fn-server] }
intent: three parallel lanes with two phase animations visualizing the ERC20 transfer round-trip
note: "node.lane must be the slug returned by swim.laneId(label), not the raw label"
```

:::

[preview:presets/swim-demo]

The code lines up three lanes horizontally and drops one node into each lane.
`flow` wires two arrows, and `animation` declares two phase chunks (time-axis chunks) for a step-by-step replay.

v0.5 Text DSL keeps `lane` and `actor` one-to-one, so the `swimlane.laneId(label)` slug resolution path is unavailable.
When you want to stack multiple nodes per lane or add a `contain` frame, reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL cannot split `lane` and `node` declarations, so use the chain API below when you need to stack multiple nodes in one lane, apply `contain` (frame), or tune `laneWidth`.

The `swimlane` function signature is shown below.

```ts
swimlane({
  id: string;
  topic: string;
  lanes: string[];           // top-edge labels passed as an array
  laneWidth?: number;        // width of one lane, default 400
  contain?: boolean;         // wrap every lane in a container frame
}): SwimlaneResult
```

The return value `SwimlaneResult` extends the low-level `DiagramBuilder` and adds a `laneId(indexOrLabel)` getter.
`laneId` resolves a lane label to its internal lane id (slug).

A complete usage example is shown below.

```ts
import { swimlane } from "@cardenelabs/cdl";

const swim = swimlane({
  id: "transfer",
  topic: "ERC20 Transfer",
  lanes: ["Sender", "Contract", "Receiver"],
});

// Resolve lane ids (labels get slugified, so non-ASCII labels work too).
const lSender   = swim.laneId("Sender");
const lContract = swim.laneId("Contract");
const lReceiver = swim.laneId("Receiver");

const transfer = swim
  .node("client", { lane: lSender,   stack: 0, kind: "actor",    title: "Client" })
  .node("fn",    { lane: lContract, stack: 0, kind: "function", title: "transfer()" })
  .node("server",   { lane: lReceiver, stack: 0, kind: "actor",    title: "Server" })
  .edges([
    { from: "client", to: "fn",  label: "call" },
    { from: "fn",    to: "server", label: "emit", tone: "success", style: "dotted-flow" },
  ])
  .phase("call", { duration: 1500, title: "call", body: "Client calls transfer." },
    (p) => p.activate("client", "fn", "client-fn"))
  .phase("emit", { duration: 1500, title: "emit", body: "Notify Server." },
    (p) => p.activate("fn", "server", "fn-server"))
  .build();
```

## Using `laneId`

The engine slugifies each label you pass to `lanes` (for example `"sender source"` -> `"sender-source"`, a conversion that preserves ASCII alphanumerics and other scripts) and turns it into a lane id.
You call `swim.laneId("sender source")` to read the internal id back without thinking about the slug rule.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Non-ASCII lane example"
type: swimlane

actors:
  - "sender"
  - "output"

flow:
  - "sender" -> "output": "transfer"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: ja, topic: "Non-ASCII lane example" }
lanes: [sender, output]
laneId_lookup:
  - { label: sender, returns: slug }
nodes:
  - { id: a, lane: "<slug from laneId('sender')>", ... }
intent: lane labels (including non-ASCII) are slugified, fetch the internal id via laneId() for node.lane
```

:::

[preview:presets/swim-demo]

v0.5 Text DSL accepts quoted non-ASCII actor names directly.
When you need the same expression through the chain API, the `swim.laneId(label)` path resolves the slug for you.

```ts
const swim = swimlane({ id: "ja", topic: "Non-ASCII lane example", lanes: ["sender", "output"] });
const lSrc = swim.laneId("sender");
swim.node("a", { lane: lSrc, ... });
```

## Aligning lane widths with `laneWidth`

Pass `laneWidth` to fix every lane to the same pixel width.
When you need lanes of different widths, drop down to the [lane primitive](/docs/en/cdl/primitives/lane) in the low-level API.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "laneWidth example"
type: swimlane

actors:
  - A
  - B
  - C

flow:
  - A -> B: "step 1"
  - B -> C: "step 2"
```

@@@ llm 🤖 For LLM

```yaml
swimlane:
  lanes: [A, B, C]
  laneWidth: 520
intent: fix every lane to 520 px width; use the low-level lane primitive when widths differ
```

:::

v0.5 Text DSL cannot set `laneWidth`, so reach for the chain API below when you need lane-width control.

```ts
swimlane({ lanes: ["A", "B", "C"], laneWidth: 520 })
```

The engine computes each lane's `x` coordinate after accounting for lane gap (space between lanes) and label clearance (padding so labels do not overlap the next lane).

## Wrapping every lane in a frame with `contain`

Pass `contain: true` to draw every lane inside a frame, which expresses a system boundary.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "contain example"
type: swimlane

actors:
  - "front"
  - "middle"
  - "back"

flow:
  - "front" -> "middle": "step 1"
  - "middle" -> "back": "step 2"
```

@@@ llm 🤖 For LLM

```yaml
swimlane:
  lanes: [front, middle, back]
  contain: true
intent: wrap the entire lane group in one container frame to express a system boundary
```

:::

v0.5 Text DSL cannot set `contain`, so reach for the chain API below when you need the framed lane-group display.

```ts
swimlane({ lanes: ["front", "middle", "back"], contain: true })
```

The frame wraps the entire lane group as one container instead of framing each lane individually.
When you only want a frame around a specific lane, drop down to the low-level API.

## Related

- [flow preset](/docs/en/cdl/presets/flow) is the choice for a single lane stacked vertically.
- [sequence preset](/docs/en/cdl/presets/sequence) is the choice when timeline round-trips are the protagonist.
- [lane primitive](/docs/en/cdl/primitives/lane) is the low-level API for declaring lanes one by one.
- [API Reference](/docs/en/cdl/reference/api#swimlane) is the canonical SSOT for type definitions.
