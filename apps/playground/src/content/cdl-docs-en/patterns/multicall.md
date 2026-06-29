# How to diagram a Multicall (multi-call through a router)

Multicall is the pattern for **running multiple function calls in a single transaction**.
Sending separate txs racks up gas and latency, but bundling them into one tx saves gas and guarantees atomicity (either everything succeeds or everything fails).
A router contract like Uniswap V3 or Multicall3 decodes the array of call data it receives and forwards each entry to its target in order.

This page walks you through writing the minimal cdl version where a User calls two targets through a Router.

## Prerequisites

This guide assumes you have done the following.

- You have skimmed the cdl [`diagram()` / `lane()` / `edges()` / `phase()` API](/docs/en/cdl/primitives).
- You have used a `multicall` function on an ERC-20 or DEX, or you at least know it exists.
- You have confirmed that `labelOffsetY` exists in [`primitives/edge.md`](/docs/en/cdl/primitives/edge); you use it here to separate two labels.

A mermaid `sequenceDiagram` can list the two calls in order, but it cannot express the sense of **passing through the Router** (the call going through the Router on its way to the target).
In cdl you apply `contain: true` to the Router lane to build an animation where the particle physically passes through the Router.

## Steps

You stand up three lanes (user, router, targets), place four nodes in them, and connect them with two edges.
Edge labels that leave the same source overlap, so you use `labelOffsetY` to spread them above and below the path.

Copy the code below as-is and the finished diagram runs.

::: tabs

@@@ humans 👤 For humans

```text
title: "Multicall (through a Router)"
type: swimlane

actors:
  - User
  - "multicall([...])": function
  - "Target 1": function
  - "Target 2": function

flow:
  - User -> "Target 1": "call 1" (dotted-flow)
  - User -> "Target 2": "call 2" (teal, dotted-flow)

animation:
  - step: "call 1: User -> Router -> Target 1" 2.4s
    focus: [User, "multicall([...])", "Target 1"]
    badge: "call 1"

  - step: "call 2: User -> Router -> Target 2" 2.4s
    focus: [User, "multicall([...])", "Target 2"]
    badge: "call 2"
```

@@@ llm 🤖 For LLM

```yaml
diagram: multicall
topic: "Multicall (through a Router)"
lanes:
  - { id: u, x: 0,   width: 280 }
  - { id: r, x: 440, width: 380, contain: true }
  - { id: t, x: 980, width: 280 }
nodes:
  - { id: user,   lane: u, stack: 0, kind: actor,    title: "User" }
  - { id: router, lane: r, stack: 0, kind: function, title: "multicall([...])", subtitle: "passthrough" }
  - { id: t1,     lane: t, stack: 0, kind: function, title: "Target 1" }
  - { id: t2,     lane: t, stack: 1, kind: function, title: "Target 2" }
edges:
  - { from: user, to: t1, label: "call 1", style: dotted-flow, labelOffsetY: -160 }
  - { from: user, to: t2, label: "call 2", tone: teal, style: dotted-flow, labelOffsetY: 200 }
phases:
  - { id: call1, duration: 2400, title: "call 1: User -> Router -> Target 1", body: "The particle passes through the Router to Target 1.", activate: [user, router, t1, user-t1], badge: "call 1" }
  - { id: call2, duration: 2400, title: "call 2: User -> Router -> Target 2", body: "The same flow, going to Target 2.",                   activate: [user, router, t2, user-t2], badge: "call 2" }
```

:::

The code above replays the flow where the User calls `multicall([call1, call2])` once and two targets are called in order internally, as two phases.
Each `flow` line points directly from `User` to `Target 1` / `Target 2`, and `animation.focus` shows the path passing through the Router lane.

v0.5 Text DSL cannot set `lane.contain` (the Router lane frame), `edge.labelOffsetY` (the vertical split between two labels), or `node.stack` (vertical Target placement).
When you need the framed Router passthrough effect or vertical label separation, reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL cannot express the `contain` frame, `labelOffsetY` label-position tuning, or `stack`-based vertical placement, so use the chain API below when you need the Router-passthrough visual effect.

```ts
import { diagram } from "@cardenelabs/cdl";

export const multicall = diagram("multicall", { topic: "Multicall (through a Router)" })
  .lane("u", { x: 0,    width: 280 })
  .lane("r", { x: 440,  width: 380, contain: true })
  .lane("t", { x: 980,  width: 280 })
  .nodes([
    { id: "user",   lane: "u", stack: 0, kind: "actor",    title: "User" },
    { id: "router", lane: "r", stack: 0, kind: "function", title: "multicall([...])", subtitle: "passthrough" },
    { id: "t1",     lane: "t", stack: 0, kind: "function", title: "Target 1" },
    { id: "t2",     lane: "t", stack: 1, kind: "function", title: "Target 2" },
  ])
  .edges([
    { from: "user", to: "t1", label: "call 1", style: "dotted-flow", labelOffsetY: -160 },
    { from: "user", to: "t2", label: "call 2", tone: "teal", style: "dotted-flow", labelOffsetY: 200 },
  ])
  .phase("call1", { duration: 2400, title: "call 1: User -> Router -> Target 1", body: "The particle passes through the Router to Target 1." },
    (p) => p.activate("user", "router", "t1", "user-t1").badge("call 1"))
  .phase("call2", { duration: 2400, title: "call 2: User -> Router -> Target 2", body: "The same flow, going to Target 2." },
    (p) => p.activate("user", "router", "t2", "user-t2").badge("call 2"))
  .build();
```

## Pattern metadata (for LLM)

Complete declarative metadata that lets an LLM mechanically process the pattern.

```yaml
pattern: multicall
intent: "single-tx batch call — User invokes router.multicall([...]) once, router decodes and forwards to N targets atomically"
lanes:
  - { id: u, role: "User (caller submitting 1 tx)",                  x: 0,   width: 280 }
  - { id: r, role: "Router contract (decodes + forwards call data)", x: 440, width: 380, contain: true }
  - { id: t, role: "Target contracts (final call destinations)",     x: 980, width: 280 }
nodes:
  - { id: user,   lane: u, stack: 0, kind: actor,    title: "User",             purpose: "submits 1 tx containing multiple calls" }
  - { id: router, lane: r, stack: 0, kind: function, title: "multicall([...])", purpose: "decodes call data array and forwards to targets" }
  - { id: t1,     lane: t, stack: 0, kind: function, title: "Target 1",         purpose: "first downstream function called" }
  - { id: t2,     lane: t, stack: 1, kind: function, title: "Target 2",         purpose: "second downstream function called" }
edges:
  - { from: user, to: t1, label: "call 1", tone: default, role: "logical call 1 (User → Router → Target 1)", labelOffsetY: -160 }
  - { from: user, to: t2, label: "call 2", tone: teal,    role: "logical call 2 (User → Router → Target 2)", labelOffsetY: 200 }
phases:
  - { id: call1, title: "call 1: User → Router → Target 1", body: "Particle passes through Router to Target 1.", duration_ms: 2400, activates: [user, router, t1, user-t1], badge: "call 1" }
  - { id: call2, title: "call 2: User → Router → Target 2", body: "Same flow, going to Target 2.",                duration_ms: 2400, activates: [user, router, t2, user-t2], badge: "call 2" }
critical_design_points:
  - "Apply contain: true to Router lane so the frame emphasizes the 'Router relays the call' fact"
  - "Set edge from = user, to = t1 / t2 to mark the final call destination as the edge endpoint (intermediate routing is expressed by phase)"
  - "Use labelOffsetY (-160 / +200) to spread two labels above and below, avoiding label overlap that occurs when both leave the same source"
  - "Use subtitle: 'passthrough' to spell out the Router's decode-and-forward role in one word"
common_mistakes:
  - "Setting edge to = router — the fact that 'targets get called' disappears, making it look like Router is the endpoint"
  - "Skipping labelOffsetY — both labels overlap in the path center and become unreadable"
  - "Removing contain from Router lane — the visual sense of particles passing through Router is lost"
  - "Cramming call 1 and call 2 into a single phase — sequential execution becomes indistinguishable from parallel execution"
related_patterns:
  - "dex-swap — another Router-based pattern, comparing the two clarifies Router usage"
  - "approve-pull — analogous structure of wrapping a center lane with contain to show internal routing"
```

## Verification

Open the diagram in your browser. You know it works when you see the following.

- A frame (contain) appears on the Router lane.
- Phase 1 (call 1) flows particles along User -> Router -> Target 1.
- Phase 2 (call 2) flows particles along User -> Router -> Target 2.
- The two edge labels ("call 1" and "call 2") show up split vertically and do not overlap.

If the labels still look overlapped, your `labelOffsetY` value may be too small.
The values here are -160 and +200, which push the labels far enough from the path.

[preview:patterns/pattern-multicall]

## Why you use `labelOffsetY`

When you draw two or more edges from the same source node (here, `user`), the labels default to the middle of the path and the text overlaps to the point of being unreadable.
`labelOffsetY` is the option that shifts a label **vertically** from the path; the value is in px.
You set the first edge to `-160` (above) and the second to `+200` (below) to make the two labels easy to read in a roughly symmetrical layout.

::: tabs

@@@ humans 👤 For humans

```text
title: "labelOffsetY example"
type: swimlane

actors:
  - User
  - "Target 1": function
  - "Target 2": function

flow:
  - User -> "Target 1": "call 1"
  - User -> "Target 2": "call 2"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: user, to: t1, label: "call 1", labelOffsetY: -160 }  # above
  - { from: user, to: t2, label: "call 2", labelOffsetY: 200 }   # below
```

:::

v0.5 Text DSL cannot express `labelOffsetY`, so when labels overlap near the path center, reach for the chain API below to spread them vertically by hand.

```ts
.edge("user", "t1", { label: "call 1", labelOffsetY: -160 })   // above
.edge("user", "t2", { label: "call 2", labelOffsetY: 200 })    // below
```

For the full spec of `labelOffsetY` (sign, unit, upper bound), see [`primitives/edge.md`](/docs/en/cdl/primitives/edge).

[preview:patterns/pattern-multicall]

## Why you write it this way

What people want to know when reading Multicall docs is **"What is the difference between separate txs and one tx?"**.
Even if they understand the gas savings and atomicity, the question of "how the calls are made in order inside" stays opaque and makes it hard to judge when to use the pattern.
Writing it in cdl shows the route that passes through the Router with particles, so the sense of two calls running back-to-back inside one tx lands intuitively.

There are three design points.

- **Add `contain: true` to the Router lane**, because even though multiple targets do not sit inside the Router, framing it emphasizes the fact that "the Router relays the call."
- **Draw edges with `from: user`**, because from the User's perspective the intent is "the User wants to call the targets," so you set the edge origin to the User and place the final call destination as `to`.
- **Use `subtitle: "passthrough"`**, because it spells out in one word that the Router decodes the tx and forwards each call to its target.

## Related docs

- The [patterns index](/docs/en/cdl/patterns/README) lets you browse the other patterns.
- [primitives/edge.md](/docs/en/cdl/primitives/edge) carries the full spec of `labelOffsetY`.
