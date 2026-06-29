# How to diagram an EIP-2612 Permit (gasless approval)

[preview:patterns/pattern-permit]

EIP-2612 (Permit) is a standard that lets you set an ERC-20 allowance with a **single off-chain signature**.
The Owner only signs, so they **never pay any gas**.
The Spender (relayer) carries the signature on-chain and calls `permit()` to finalize the allowance.

This page walks you through writing that three-step flow in cdl as a three-phase animation.

## Prerequisites

This guide assumes you have done the following.

- You have skimmed the cdl [`diagram()` / `lane()` / `nodes()` / `edges()` / `phase()` API](/docs/en/cdl/primitives).
- You know the two ERC-20 steps `approve` and `transferFrom`.
- You know that EIP-712 (typed-data signing) exists; you do not need to know the details.

A mermaid `sequenceDiagram` collapses this into a single still image, but cdl lets you animate the three steps (sign, relay, execute) as separate phases.

## Steps

You stand up three vertical lanes, place five nodes in them, and connect those nodes with four edges.
At the end, you add the configuration that plays back the three phases sign, relay, and execute in order.

Copy the code below as-is and the finished diagram runs on your machine.

::: tabs

@@@ humans 👤 For humans

```text
title: "EIP-2612 Permit (gasless)"
type: sequence

actors:
  - Owner
  - Spender
  - "EIP-712 typed-data": card
  - "permit(...sig)": function
  - allowances: storage

flow:
  - Owner -> "EIP-712 typed-data": "sign" (info, dotted-flow)
  - "EIP-712 typed-data" -> Spender: "send sig" (info, dotted-flow)
  - Spender -> "permit(...sig)": "permit(sig)" (accent, dotted-flow)
  - "permit(...sig)" -> allowances: "set allowance" (teal, dotted-flow)

states:
  allowance: 0

animation:
  - step: "Off-chain signature" 1.8s
    focus: [Owner, "EIP-712 typed-data"]
    badge: "signed"

  - step: "Spender relays" 1.8s
    focus: ["EIP-712 typed-data", Spender]
    badge: "relayed"

  - step: "Spender executes on-chain" 1.8s
    focus: [Spender, "permit(...sig)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"
```

@@@ llm 🤖 For LLM

```yaml
diagram: permit
topic: "EIP-2612 Permit (gasless)"
lanes:
  - { id: o, x: 0,    width: 320 }
  - { id: s, x: 540,  width: 360 }
  - { id: t, x: 1240, width: 420, contain: true }
state:
  - { id: allowance, initial: 0 }
nodes:
  - { id: owner,    lane: o, stack: 0, kind: actor,    title: "Owner",              subtitle: "sign only (gas 0)" }
  - { id: spender,  lane: s, stack: 0, kind: actor,    title: "Spender",            subtitle: "relayer" }
  - { id: eip712,   lane: s, stack: 1, kind: card,     title: "EIP-712 typed-data", subtitle: "domain + Permit struct" }
  - { id: permitFn, lane: t, stack: 0, kind: function, title: "permit(...sig)" }
  - { id: allowMap, lane: t, stack: 1, kind: storage,  title: "allowances",         rows: ["amt: {allowance}"] }
edges:
  - { from: owner,    to: eip712,   label: "sign",          tone: info,   style: dotted-flow }
  - { from: eip712,   to: spender,  label: "send sig",      tone: info,   style: dotted-flow }
  - { from: spender,  to: permitFn, label: "permit(sig)",   tone: accent, style: dotted-flow }
  - { from: permitFn, to: allowMap, label: "set allowance", tone: teal,   style: dotted-flow }
phases:
  - { id: sign,    duration: 1800, title: "Off-chain signature",       body: "Owner signs EIP-712 typed-data (no gas required).",     activate: [owner, eip712, owner-eip712], badge: "signed" }
  - { id: relay,   duration: 1800, title: "Spender relays",            body: "Spender receives the sig from Owner and relays it on-chain.", activate: [eip712, spender, eip712-spender], badge: "relayed" }
  - { id: execute, duration: 1800, title: "Spender executes on-chain", body: "Call permit to set the allowance.",                     activate: [spender, permitFn, allowMap, spender-permitFn, permitFn-allowMap], tween: [{ state: allowance, from: 0, to: 100 }], badge: "approved" }
```

:::

The code above places the three roles Owner, Spender, and Token contract in separate lanes and replays the sign -> relay -> execute flow as three phases on a timeline.
You tween the `allowance` state from 0 to 100 to visualize the moment the allowance is set.

v0.5 Text DSL cannot set lane `x` / `width` / `contain` (the framed lane), or per-node `stack` / `subtitle` / `rows`.
When you need to fix lane positions and place a function plus a storage stacked inside the Token contract lane, reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL is intentionally minimal: it cannot express physical lane positions (`x` / `width` / `contain`), per-node `stack` / `subtitle` / `rows`, or `edge.labelOffsetX`.
When you need three-lane physical layout with the function and storage stacked vertically inside the Token contract lane, use the chain API below.

```ts
import { diagram } from "@cardenelabs/cdl";

export const permit = diagram("permit", { topic: "EIP-2612 Permit (gasless)" })
  .lane("o", { x: 0,    width: 320 })
  .lane("s", { x: 540,  width: 360 })
  .lane("t", { x: 1240, width: 420, contain: true })
  .state("allowance", { initial: 0 })
  .nodes([
    { id: "owner",    lane: "o", stack: 0, kind: "actor",    title: "Owner",    subtitle: "sign only (gas 0)" },
    { id: "spender",  lane: "s", stack: 0, kind: "actor",    title: "Spender",  subtitle: "relayer" },
    { id: "eip712",   lane: "s", stack: 1, kind: "card",     title: "EIP-712 typed-data", subtitle: "domain + Permit struct" },
    { id: "permitFn", lane: "t", stack: 0, kind: "function", title: "permit(...sig)" },
    { id: "allowMap", lane: "t", stack: 1, kind: "storage",  title: "allowances", rows: ["amt: {allowance}"] },
  ])
  .edges([
    { from: "owner",    to: "eip712",   label: "sign",          tone: "info",    style: "dotted-flow" },
    { from: "eip712",   to: "spender",  label: "send sig",      tone: "info",    style: "dotted-flow" },
    { from: "spender",  to: "permitFn", label: "permit(sig)",   tone: "accent",  style: "dotted-flow" },
    { from: "permitFn", to: "allowMap", label: "set allowance", tone: "teal",    style: "dotted-flow" },
  ])
  .phase("sign", { duration: 1800, title: "Off-chain signature", body: "Owner signs EIP-712 typed-data (no gas required)." },
    (p) => p.activate("owner", "eip712", "owner-eip712").badge("signed"))
  .phase("relay", { duration: 1800, title: "Spender relays", body: "Spender receives the sig from Owner and relays it on-chain." },
    (p) => p.activate("eip712", "spender", "eip712-spender").badge("relayed"))
  .phase("execute", { duration: 1800, title: "Spender executes on-chain", body: "Call permit to set the allowance." },
    (p) => p.activate("spender", "permitFn", "allowMap", "spender-permitFn", "permitFn-allowMap").tween("allowance", 0, 100).badge("approved"))
  .build();
```

## Pattern metadata (for LLM)

Complete declarative metadata that lets an LLM mechanically process the pattern.

```yaml
pattern: permit
intent: "EIP-2612 gasless approval — Owner signs off-chain (gas 0), Spender relays the sig on-chain and calls permit() to set allowance"
lanes:
  - { id: o, role: "Owner (off-chain signer)",                        x: 0,    width: 320 }
  - { id: s, role: "Spender (relayer, on-chain caller)",              x: 540,  width: 360 }
  - { id: t, role: "Token contract (ERC-20 with EIP-2612)",           x: 1240, width: 420, contain: true }
state:
  - { id: allowance, initial: 0, purpose: "ERC-20 allowance set by permit()" }
nodes:
  - { id: owner,    lane: o, stack: 0, kind: actor,    title: "Owner",              purpose: "subject of approval, pays no gas" }
  - { id: spender,  lane: s, stack: 0, kind: actor,    title: "Spender",            purpose: "relayer that submits the on-chain tx" }
  - { id: eip712,   lane: s, stack: 1, kind: card,     title: "EIP-712 typed-data", purpose: "signed payload (domain + Permit struct)" }
  - { id: permitFn, lane: t, stack: 0, kind: function, title: "permit(...sig)",     purpose: "verifies sig, mutates allowance" }
  - { id: allowMap, lane: t, stack: 1, kind: storage,  title: "allowances",         purpose: "on-chain allowance map (key=spender)" }
edges:
  - { from: owner,    to: eip712,   label: "sign",          tone: info,   role: "off-chain signature creation" }
  - { from: eip712,   to: spender,  label: "send sig",      tone: info,   role: "sig handoff off-chain to relayer" }
  - { from: spender,  to: permitFn, label: "permit(sig)",   tone: accent, role: "on-chain call with sig payload" }
  - { from: permitFn, to: allowMap, label: "set allowance", tone: teal,   role: "verified sig writes allowance" }
phases:
  - { id: sign,    title: "Off-chain signature",     body: "Owner signs EIP-712 typed-data (no gas).",  duration_ms: 1800, activates: [owner, eip712, owner-eip712], badge: "signed" }
  - { id: relay,   title: "Spender relays sig",      body: "Spender receives sig from Owner.",          duration_ms: 1800, activates: [eip712, spender, eip712-spender], badge: "relayed" }
  - { id: execute, title: "Spender executes on-chain", body: "Call permit() to set allowance.",         duration_ms: 1800, activates: [spender, permitFn, allowMap, spender-permitFn, permitFn-allowMap], tweens: [{ state: allowance, from: 0, to: 100 }], badge: "approved" }
critical_design_points:
  - "Split Owner / Spender / Token into 3 lanes so left-right position alone shows the on-chain vs off-chain boundary"
  - "Make EIP-712 typed-data its own card node rather than burying it in Owner subtitle, communicating sig target as a separate object"
  - "Break sign → relay → execute into 3 phases so the timeline order is explicit (cramming into 1 frame loses ordering)"
  - "Tween allowance 0 → 100 so the moment permit() finalizes the allowance lands through visible numeric movement"
common_mistakes:
  - "Putting Owner and Spender in the same lane — erases the fact that only Spender pays gas"
  - "Storing EIP-712 inside Owner subtitle — hides that the signing target is a separate object"
  - "Using solid lines for all edges — 4 static arrows kill the sense of time (dotted-flow is required)"
  - "Forgetting the state tween in phase 3 — allowance number stays fixed and permit() effect is invisible"
related_patterns:
  - "approve-pull — the legacy ERC-20 version that sets the same allowance on-chain (Owner pays gas)"
  - "bridge — same 3-lane plus 3-phase shape applied to the cross-chain case"
```

## Verification

Open the diagram in your browser. You know it works when you see the following.

- Phase 1 (sign) flows particles from Owner to the EIP-712 typed-data card, and the "signed" badge appears.
- Phase 2 (relay) flows particles from the card to Spender, and the "relayed" badge appears.
- Phase 3 (execute) flows particles from Spender -> permit() -> allowances, and the number inside allowances grows smoothly from **0 to 100**.

If the allowance number stays fixed, phase 3 probably never reaches `.tween("allowance", 0, 100)`.
Check that you declared the state with `state("allowance", { initial: 0 })`.

[preview:patterns/pattern-permit]

## Why you write it this way

The heart of this pattern is **putting on-chain and off-chain work into a single picture**.
People reading EIP-2612 for the first time stumble on two questions: "Who pays the gas?" and "Where is the sig produced, and where is it used?"
Writing this in cdl resolves both at once through lane separation and a timeline of phases.

There are four design points.

- **Split into three lanes**, so the Owner (off-chain), Spender (relayer), and Token contract live in separate lanes. The left-to-right position alone tells you what runs on-chain and what runs off-chain.
- **Make EIP-712 its own node**, rather than burying typed-data in the Owner's subtitle. Drawing it as a `kind: "card"` node communicates that the signing target exists as a separate object.
- **Break the flow into three phases**, because sign -> relay -> execute loses its ordering when you cram it into one frame. The phase split puts the sequence on a timeline.
- **Tween the allowance**, so the number visibly moves from 0 to 100. That movement makes "permit() sets the allowance" land intuitively.

You set every edge to `style: "dotted-flow"` to convey the feel of a sig or call physically flowing through the diagram.
Solid lines would leave four static arrows side by side, and the sense of time would not land.

## Related docs

- The [patterns index](/docs/en/cdl/patterns/README) lets you browse the other patterns.
- [Bridge](/docs/en/cdl/patterns/bridge) is the cross-chain version of the same three-lane plus three-phase shape.
- [Cookbook example 5](/docs/en/cdl/overview/cookbook) walks you through a full implementation that combines permit with the Proxy pattern.
