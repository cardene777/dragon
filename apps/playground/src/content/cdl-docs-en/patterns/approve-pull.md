# How to diagram an ERC-20 Approve -> Pull (2-step transfer)

[preview:patterns/pattern-approve-pull]

Moving an ERC-20 asset on someone else's behalf requires a **2-step transfer**.
The Owner sets an allowance (the amount that can be withdrawn) with `approve(spender, n)`, and the Spender pulls the asset with `transferFrom(owner, ...)`.
It is pull-based rather than push-based, so the Owner does not move the asset; they only hand over "permission."

This page walks you through splitting the picture into three lanes (Owner, Token contract, Spender) and visualizing how the allowance grows and shrinks across the two phases approve and pull.

## Prerequisites

This guide assumes you have done the following.

- You have skimmed the cdl [`diagram()` / `lane()` / `state()` / `phase()` API](/docs/en/cdl/primitives).
- You know the three ERC-20 functions `approve`, `transferFrom`, and `allowance`.
- You understand that the Owner pays gas for the approve, and (unlike push transfers) the Spender pays gas on the pull.

A mermaid `sequenceDiagram` can lay out the two steps, but it cannot express **the allowance going up on approve and coming down on pull**.
With `state("allowance")` plus `tween`, cdl moves the number directly so the reader can see it.

## Steps

You stand up three lanes (owner, token, spender) and stack approveFn / allowMap / pullFn vertically inside the center Token lane at stack 0, 1, and 2.
Declare one state, `allowance`, and move it from 0 to 100 in the approve phase and from 100 to 60 in the pull phase.

Copy the code below as-is and the finished diagram runs.

::: tabs

@@@ humans 👤 For humans

```text
title: "Approve -> Pull (2 step)"
type: swimlane

actors:
  - Owner
  - "approve(spender, n)": function
  - allowances: storage
  - "transferFrom(...)": function
  - Spender

flow:
  - Owner -> "approve(spender, n)": "approve" (dotted-flow)
  - "approve(spender, n)" -> allowances: "set" (teal, dotted-flow)
  - Spender -> "transferFrom(...)": "transferFrom" (warning, dotted-flow)
  - "transferFrom(...)" -> allowances: "decrement" (warning, dotted-flow)

states:
  allowance: 0

animation:
  - step: "Owner: approve" 1.8s
    focus: [Owner, "approve(spender, n)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"

  - step: "Spender: transferFrom" 1.8s
    focus: [Spender, "transferFrom(...)", allowances]
    tween:
      allowance: 100 -> 60
    badge: "pulled"
```

@@@ llm 🤖 For LLM

```yaml
diagram: approve-pull
topic: "Approve -> Pull (2 step)"
lanes:
  - { id: owner,   x: 0,    width: 280 }
  - { id: token,   x: 500,  width: 420 }
  - { id: spender, x: 1280, width: 280 }
state:
  - { id: allowance, initial: 0 }
nodes:
  - { id: o,         lane: owner,   stack: 0, kind: actor,    title: "Owner" }
  - { id: approveFn, lane: token,   stack: 0, kind: function, title: "approve(spender, n)" }
  - { id: allowMap,  lane: token,   stack: 1, kind: storage,  title: "allowances",        rows: ["sp: {allowance}"] }
  - { id: pullFn,    lane: token,   stack: 2, kind: function, title: "transferFrom(...)" }
  - { id: s,         lane: spender, stack: 0, kind: actor,    title: "Spender" }
edges:
  - { from: o,         to: approveFn, label: "approve",      style: dotted-flow }
  - { from: approveFn, to: allowMap,  label: "set",          tone: teal,    style: dotted-flow }
  - { from: s,         to: pullFn,    label: "transferFrom", tone: warning, style: dotted-flow }
  - { from: pullFn,    to: allowMap,  label: "decrement",    tone: warning, style: dotted-flow, labelOffsetX: 160 }
phases:
  - { id: approve, duration: 1800, title: "Owner: approve",         body: "Owner sets the allowance for the Spender.",                                      activate: [o, approveFn, allowMap, o-approveFn, approveFn-allowMap], tween: [{ state: allowance, from: 0,   to: 100 }], badge: "approved" }
  - { id: pull,    duration: 1800, title: "Spender: transferFrom",  body: "Spender pulls the asset within the allowance, and the allowance is decremented.", activate: [s, pullFn, allowMap, s-pullFn, pullFn-allowMap], tween: [{ state: allowance, from: 100, to: 60 }],  badge: "pulled" }
```

:::

The code above shows the Owner and the Spender both hitting different functions (`approve` and `transferFrom`) on the same Token contract across different phases.
The allowance map (`allowances`) is touched by both phases, so placing it in the middle naturally collects the movement of both phases.

v0.5 Text DSL cannot set `lane.x` / `lane.width` (the wider center Token lane), `node.stack` (vertical placement of the three Token internals), `node.rows` (numeric allowance display), or `edge.labelOffsetX` (sliding the decrement label rightward).
When you need the wider center lane with stacked internals or label-position tuning, reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL cannot express physical lane layout (`x` / `width`), `stack`-based vertical placement in the same lane, `node.rows` numeric interpolation, or `edge.labelOffsetX` label-position tuning, so use the chain API below when you need the Token contract's internal vertical layout.

```ts
import { diagram } from "@cardenelabs/cdl";

export const approvePull = diagram("approve-pull", { topic: "Approve -> Pull (2 step)" })
  .lane("owner",   { x: 0,    width: 280 })
  .lane("token",   { x: 500,  width: 420 })
  .lane("spender", { x: 1280, width: 280 })
  .state("allowance", { initial: 0 })
  .nodes([
    { id: "o",         lane: "owner",   stack: 0, kind: "actor",    title: "Owner" },
    { id: "approveFn", lane: "token",   stack: 0, kind: "function", title: "approve(spender, n)" },
    { id: "allowMap",  lane: "token",   stack: 1, kind: "storage",  title: "allowances", rows: ["sp: {allowance}"] },
    { id: "pullFn",    lane: "token",   stack: 2, kind: "function", title: "transferFrom(...)" },
    { id: "s",         lane: "spender", stack: 0, kind: "actor",    title: "Spender" },
  ])
  .edges([
    { from: "o",         to: "approveFn", label: "approve",      style: "dotted-flow" },
    { from: "approveFn", to: "allowMap",  label: "set",          tone: "teal", style: "dotted-flow" },
    { from: "s",         to: "pullFn",    label: "transferFrom", tone: "warning", style: "dotted-flow" },
    { from: "pullFn",    to: "allowMap",  label: "decrement",    tone: "warning", style: "dotted-flow", labelOffsetX: 160 },
  ])
  .phase("approve", { duration: 1800, title: "Owner: approve", body: "Owner sets the allowance for the Spender." },
    (p) => p.activate("o", "approveFn", "allowMap", "o-approveFn", "approveFn-allowMap").tween("allowance", 0, 100).badge("approved"))
  .phase("pull",    { duration: 1800, title: "Spender: transferFrom", body: "Spender pulls the asset within the allowance, and the allowance is decremented." },
    (p) => p.activate("s", "pullFn", "allowMap", "s-pullFn", "pullFn-allowMap").tween("allowance", 100, 60).badge("pulled"))
  .build();
```

## Pattern metadata (for LLM)

Complete declarative metadata that lets an LLM mechanically process the pattern.

```yaml
pattern: approve-pull
intent: "ERC-20 2-step transfer — Owner approves allowance (phase 1), Spender pulls via transferFrom and decrements allowance (phase 2)"
lanes:
  - { id: owner,   role: "Owner (asset holder, sets allowance)",                x: 0,    width: 280 }
  - { id: token,   role: "Token contract (ERC-20, holds approve/transferFrom)", x: 500,  width: 420 }
  - { id: spender, role: "Spender (third party that pulls asset)",              x: 1280, width: 280 }
state:
  - { id: allowance, initial: 0, purpose: "allowance[owner][spender] in ERC-20 storage" }
nodes:
  - { id: o,         lane: owner,   stack: 0, kind: actor,    title: "Owner",                 purpose: "subject of approve, pays gas on approve" }
  - { id: approveFn, lane: token,   stack: 0, kind: function, title: "approve(spender, n)",   purpose: "sets allowance[caller][spender] = n" }
  - { id: allowMap,  lane: token,   stack: 1, kind: storage,  title: "allowances",            purpose: "on-chain allowance map, mutated by both phases" }
  - { id: pullFn,    lane: token,   stack: 2, kind: function, title: "transferFrom(...)",     purpose: "spender-called, decrements allowance and moves asset" }
  - { id: s,         lane: spender, stack: 0, kind: actor,    title: "Spender",               purpose: "third party that pulls, pays gas on pull" }
edges:
  - { from: o,         to: approveFn, label: "approve",      tone: default, role: "Owner invokes approve" }
  - { from: approveFn, to: allowMap,  label: "set",          tone: teal,    role: "approve writes allowance value" }
  - { from: s,         to: pullFn,    label: "transferFrom", tone: warning, role: "Spender invokes transferFrom" }
  - { from: pullFn,    to: allowMap,  label: "decrement",    tone: warning, role: "transferFrom subtracts from allowance", labelOffsetX: 160 }
phases:
  - { id: approve, title: "Owner: approve",         body: "Owner sets allowance for Spender.",                                duration_ms: 1800, activates: [o, approveFn, allowMap, o-approveFn, approveFn-allowMap], tweens: [{ state: allowance, from: 0, to: 100 }], badge: "approved" }
  - { id: pull,    title: "Spender: transferFrom",  body: "Spender pulls asset within allowance, allowance is decremented.", duration_ms: 1800, activates: [s, pullFn, allowMap, s-pullFn, pullFn-allowMap], tweens: [{ state: allowance, from: 100, to: 60 }], badge: "pulled" }
critical_design_points:
  - "Split Owner / Token / Spender into 3 lanes and give the center Token lane extra width to stack 3 internal elements vertically"
  - "Collect stack 0 / 1 / 2 in the center lane so approveFn / allowMap / pullFn vertical layout visualizes the 'set → decrement' top-down flow"
  - "Shift the pullFn → allowMap label right via labelOffsetX: 160 to avoid path crossings with other edge labels"
  - "Move allowance through 0 → 100 → 60 so 'approve grants permission, transferFrom consumes it' lands through balance movement alone"
common_mistakes:
  - "Stacking approveFn and pullFn in the same stack — invites the misread 'you are calling the same function twice'"
  - "Putting allowMap at an edge stack — both phases touch it, so it must sit at center stack 1 to collect motion visually"
  - "Starting phase 2 tween from 0 instead of 100 — breaks the continuity carried over from the approve phase"
  - "Skipping labelOffsetX — the 'decrement' label overlaps with other edge labels and becomes unreadable"
related_patterns:
  - "permit — the EIP-2612 version that achieves the same allowance setup with zero gas (off-chain signature)"
  - "dex-swap — analogous structure of representing a contract's internals through contain"
```

## Verification

Open the diagram in your browser. You know it works when you see the following.

- The three lanes line up from left to right as Owner / Token / Spender.
- approve / allowMap / transferFrom stack vertically inside the center Token lane.
- Phase 1 (approve) flows particles along Owner -> approve -> allowances, and the number inside allowances moves **0 -> 100**.
- Phase 2 (pull) flows particles along Spender -> transferFrom -> allowances, and the number moves **100 -> 60** as it is decremented.

If the "decrement" label overlaps with another edge, your `labelOffsetX: 160` may be too small.
The value here shifts the label 160 px to the right of the path.

[preview:patterns/pattern-approve-pull]

## Why you write it this way

The spot where people stumble in ERC-20 docs is **"Why pull instead of push?"**.
Unlike a push transfer (`transfer`), `transferFrom` is called by a **third party (the Spender)**, which is required when you want a contract to handle assets flowing in and out.
Splitting the permission (approve) from the withdrawal (transferFrom) into separate steps means the Owner does not pay gas on the spot, and the Spender only pulls when they need to.

There are four design points.

- **Split into three lanes**, placing Owner / Token / Spender in their own lanes, and give the center Token lane extra width so the three internal elements can stack vertically.
- **Collect stack 0 / 1 / 2 in the center lane**, because stacking approveFn / allowMap / pullFn vertically makes the up-down flow of "approve sets the allowance, then transferFrom decrements it" land intuitively.
- **Push the label right with `labelOffsetX: 160`**, because the `pullFn -> allowMap` label crosses other edge labels on the path, so a 160 px horizontal shift avoids the collision.
- **Move the allowance through 0 -> 100 -> 60**, because using `tween` to show the number rising and falling lands "approve grants the permission and transferFrom consumes it" through balance movement alone.

You put approveFn and pullFn in different stacks because, even though they live in the same contract, they are different functions.
Drawing them as one would invite the misread "you are calling the same function twice."

## Related docs

- The [patterns index](/docs/en/cdl/patterns/README) lets you browse the other patterns.
- [Permit](/docs/en/cdl/patterns/permit) is the EIP-2612 version that pulls off the same allowance setup **with zero gas (off-chain signature)**.
