# How to diagram a DEX Swap (AMM with constant product)

[preview:patterns/pattern-dex-swap]

A DEX Swap is the core pattern of a Uniswap-style DEX (Decentralized Exchange, an exchange with no central operator).
When a Trader puts in token A, the AMM (Automated Market Maker) hands back token B based on the **constant product (`x * y = k`, where the product of reserves stays fixed)**.
The price comes from the reserve ratio (`reserveB / reserveA`) rather than an orderbook, so the price moves with every swap.

This page shows you how to write the diagram with three lanes (Trader, Router, Pair) and visualize how the reserves shift.

## Prerequisites

This guide assumes you have done the following.

- You have skimmed the cdl [`diagram()` / `lane()` / `state()` / `phase()` API](/docs/en/cdl/primitives).
- You know the Uniswap V2-style constant-product AMM (`x * y = k`).
- You know that a Router contract computes the path across multiple Pairs.

mermaid cannot express the numeric movement of state, but cdl can smoothly animate **four states at the same time inside one phase** through `state()` plus `tween()`.

## Steps

You stand up three lanes (trader, router, pair), place four nodes in them, and connect them with three edges.
Declare four states (reserveA, reserveB, userA, userB) and tween them all together in the final settle phase.

Copy the code below as-is and the finished diagram runs.

::: tabs

@@@ humans 👤 For humans

```text
title: "DEX Swap (AMM)"
type: swimlane

actors:
  - Trader
  - "swap(...)": function
  - "Pair.swap": function
  - reserves: storage

flow:
  - Trader -> "swap(...)": "swap A->B" (dotted-flow)
  - "swap(...)" -> "Pair.swap": "forward" (teal, dotted-flow)
  - "Pair.swap" -> reserves: "update" (warning, dotted-flow)

states:
  reserveA: 1000
  reserveB: 1000
  userA: 100
  userB: 0

animation:
  - step: "Trader -> Router" 1.8s
    focus: [Trader, "swap(...)"]
    badge: "call"

  - step: "Router -> Pair" 1.8s
    focus: ["swap(...)", "Pair.swap"]
    badge: "swap"

  - step: "Reserves updated" 1.8s
    focus: ["Pair.swap", reserves]
    tween:
      reserveA: 1000 -> 1100
      reserveB: 1000 -> 910
      userA: 100 -> 0
      userB: 0 -> 90
    badge: "settled"
```

@@@ llm 🤖 For LLM

```yaml
diagram: dex-swap
topic: "DEX Swap (AMM)"
lanes:
  - { id: u, x: 0,    width: 280 }
  - { id: r, x: 460,  width: 380 }
  - { id: p, x: 1080, width: 280, contain: true }
state:
  - { id: reserveA, initial: 1000 }
  - { id: reserveB, initial: 1000 }
  - { id: userA,    initial: 100 }
  - { id: userB,    initial: 0 }
nodes:
  - { id: user,     lane: u, stack: 0, kind: actor,    title: "Trader",    value: "{userA}" }
  - { id: router,   lane: r, stack: 0, kind: function, title: "swap(...)", subtitle: "route computation" }
  - { id: pair,     lane: p, stack: 0, kind: function, title: "Pair.swap", subtitle: "x*y=k" }
  - { id: reserves, lane: p, stack: 1, kind: storage,  title: "reserves",  rows: ["A: {reserveA}", "B: {reserveB}"] }
edges:
  - { from: user,   to: router,   label: "swap A->B", style: dotted-flow }
  - { from: router, to: pair,     label: "forward",   tone: teal,    style: dotted-flow }
  - { from: pair,   to: reserves, label: "update",    tone: warning, style: dotted-flow }
phases:
  - { id: call,   duration: 1800, title: "Trader -> Router", body: "Call swap through the Router.",                                                  activate: [user, router, user-router], badge: "call" }
  - { id: swap,   duration: 1800, title: "Router -> Pair",   body: "The Pair contract computes the output through the constant-product formula.",   activate: [router, pair, router-pair], badge: "swap" }
  - { id: settle, duration: 1800, title: "Reserves updated", body: "Reserves are updated, and the price = reserveB/reserveA shifts.",               activate: [pair, reserves, pair-reserves], tween: [{ state: reserveA, from: 1000, to: 1100 }, { state: reserveB, from: 1000, to: 910 }, { state: userA, from: 100, to: 0 }, { state: userB, from: 0, to: 90 }], badge: "settled" }
```

:::

The code above reproduces a swap where the Trader puts in 100 token A and receives 90 token B.
The heart is animating four states together in the final settle phase.

v0.5 Text DSL cannot set lane `x` / `width` / `contain` (the Pair lane frame), `node.value` (Trader balance display), or `node.rows` (reserves numeric display).
When you need the Pair contract boundary (`contain`) and numeric reserves display, reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL cannot express physical lane positions (`x` / `width` / `contain`) or `node.subtitle` / `node.value` / `node.rows`, so use the chain API below when you need the Pair lane framed or `{reserveA}` / `{reserveB}` numeric interpolation inside the reserves storage.

```ts
import { diagram } from "@cardenelabs/cdl";

export const dexSwap = diagram("dex-swap", { topic: "DEX Swap (AMM)" })
  .lane("u", { x: 0,    width: 280 })
  .lane("r", { x: 460,  width: 380 })
  .lane("p", { x: 1080, width: 280, contain: true })
  .state("reserveA", { initial: 1000 })
  .state("reserveB", { initial: 1000 })
  .state("userA",    { initial: 100 })
  .state("userB",    { initial: 0 })
  .nodes([
    { id: "user",     lane: "u", stack: 0, kind: "actor",    title: "Trader", value: "{userA}" },
    { id: "router",   lane: "r", stack: 0, kind: "function", title: "swap(...)", subtitle: "route computation" },
    { id: "pair",     lane: "p", stack: 0, kind: "function", title: "Pair.swap", subtitle: "x*y=k" },
    { id: "reserves", lane: "p", stack: 1, kind: "storage",  title: "reserves", rows: ["A: {reserveA}", "B: {reserveB}"] },
  ])
  .edges([
    { from: "user",   to: "router", label: "swap A->B", style: "dotted-flow" },
    { from: "router", to: "pair",   label: "forward",  tone: "teal",    style: "dotted-flow" },
    { from: "pair",   to: "reserves", label: "update", tone: "warning", style: "dotted-flow" },
  ])
  .phase("call",   { duration: 1800, title: "Trader -> Router",  body: "Call swap through the Router." },
    (p) => p.activate("user", "router", "user-router").badge("call"))
  .phase("swap",   { duration: 1800, title: "Router -> Pair",    body: "The Pair contract computes the output through the constant-product formula." },
    (p) => p.activate("router", "pair", "router-pair").badge("swap"))
  .phase("settle", { duration: 1800, title: "Reserves updated",  body: "Reserves are updated, and the price = reserveB/reserveA shifts." },
    (p) => p.activate("pair", "reserves", "pair-reserves")
      .tween("reserveA", 1000, 1100)
      .tween("reserveB", 1000, 910)
      .tween("userA", 100, 0)
      .tween("userB", 0, 90)
      .badge("settled"))
  .build();
```

## Pattern metadata (for LLM)

Complete declarative metadata that lets an LLM mechanically process the pattern.

```yaml
pattern: dex-swap
intent: "Uniswap V2-style AMM swap — Trader → Router → Pair, constant product x*y=k mutates 4 states (reserves + user balances) in parallel"
lanes:
  - { id: u, role: "Trader (end user)",                       x: 0,    width: 280 }
  - { id: r, role: "Router contract (route computation)",     x: 460,  width: 380 }
  - { id: p, role: "Pair contract (swap logic + reserves)",   x: 1080, width: 280, contain: true }
state:
  - { id: reserveA, initial: 1000, purpose: "token A reserve in Pair pool" }
  - { id: reserveB, initial: 1000, purpose: "token B reserve in Pair pool" }
  - { id: userA,    initial: 100,  purpose: "token A balance held by Trader" }
  - { id: userB,    initial: 0,    purpose: "token B balance held by Trader" }
nodes:
  - { id: user,     lane: u, stack: 0, kind: actor,    title: "Trader",    purpose: "initiates swap A→B" }
  - { id: router,   lane: r, stack: 0, kind: function, title: "swap(...)", purpose: "computes path across Pairs" }
  - { id: pair,     lane: p, stack: 0, kind: function, title: "Pair.swap", purpose: "applies x*y=k constant product" }
  - { id: reserves, lane: p, stack: 1, kind: storage,  title: "reserves",  purpose: "stores reserveA and reserveB" }
edges:
  - { from: user,   to: router,   label: "swap A→B", tone: default, role: "user invokes Router with desired swap" }
  - { from: router, to: pair,     label: "forward",  tone: teal,    role: "Router forwards to target Pair" }
  - { from: pair,   to: reserves, label: "update",   tone: warning, role: "x*y=k mutates reserves storage" }
phases:
  - { id: call,   title: "Trader → Router",  body: "Call swap through Router.",                          duration_ms: 1800, activates: [user, router, user-router], badge: "call" }
  - { id: swap,   title: "Router → Pair",    body: "Pair contract computes output via x*y=k.",           duration_ms: 1800, activates: [router, pair, router-pair], badge: "swap" }
  - { id: settle, title: "Reserves updated", body: "Reserves update, price = reserveB/reserveA shifts.", duration_ms: 1800, activates: [pair, reserves, pair-reserves], tweens: [{ state: reserveA, from: 1000, to: 1100 }, { state: reserveB, from: 1000, to: 910 }, { state: userA, from: 100, to: 0 }, { state: userB, from: 0, to: 90 }], badge: "settled" }
critical_design_points:
  - "Tween 4 states in parallel in settle phase so 'Trader and pool swap assets in the same instant' lands visually"
  - "Apply contain: true to Pair lane so the frame makes the 'outside Router, inside Pair' boundary explicit"
  - "Keep Router as a separate lane (Trader → Pair direct skip erases the route-computation role that V2 actually requires)"
  - "Show constant product numerically — 1000×1000 = 1,000,000 → 1100×910 = 1,001,000 confirms k is preserved (slight gap models the fee)"
common_mistakes:
  - "Tweening only 1 state in settle phase — the AMM essence 'price comes from reserve ratio alone' fails to land"
  - "Skipping Router by connecting Trader → Pair directly — denies the fact that real Uniswap V2 mandates the Router"
  - "Dropping contain on Pair lane — the boundary that swap function and reserves storage live in the same contract disappears"
  - "Forgetting userA / userB tweens — Trader balance does not move, leaving only one side of the asset exchange visible"
related_patterns:
  - "multicall — another Router-based pattern, comparing the two clarifies Router usage"
  - "approve-pull — analogous structure of representing a contract's internals through contain"
```

## Verification

Open the diagram in your browser. You know it works when you see the following.

- Phase 1 (call) flows particles from Trader -> Router.
- Phase 2 (swap) flows particles from Router -> Pair.
- Phase 3 (settle) moves four numbers smoothly at the same time.
  - reserveA moves **1000 -> 1100** (the A the Trader put in is added to the pool).
  - reserveB moves **1000 -> 910** (the B paid out to the Trader leaves the pool).
  - userA moves **100 -> 0** (the A leaves the Trader's hands).
  - userB moves **0 -> 90** (the B arrives in the Trader's hands).

If any state does not move, check that the id in `state()` matches the id in `tween()` exactly.

[preview:patterns/pattern-dex-swap]

## Why you write it this way

What people most want to know when reading AMM docs is **"What sets the price?"**.
It is not a fixed quote, not an oracle reference: **only the reserve ratio sets the price**. That is the essence of an AMM.
In words it sounds abstract, but showing four numbers moving at the same time lands the idea in one shot.

There are three design points.

- **Tween four states in parallel**, so animating reserveA, reserveB, userA, and userB together in one phase lets the reader see "the Trader and the pool swapped assets" visually.
- **Show the constant product numerically**, so before the swap `1000 * 1000 = 1,000,000` and after the swap `1100 * 910 = 1,001,000` confirm that k is almost preserved (the slight gap models the fee).
- **Add `contain: true` to the Pair lane**, so a frame around the inside of the Pair contract (swap function plus reserves storage) makes the "outside the Router, inside the Pair" boundary explicit.

You put the Router in its own lane because actual Uniswap V2 only lets you swap through the Router.
Skipping the Router and connecting Trader -> Pair directly would erase the Router's role of route computation.

## Related docs

- The [patterns index](/docs/en/cdl/patterns/README) lets you browse the other patterns.
- [Multicall](/docs/en/cdl/patterns/multicall) is another Router-based pattern, and comparing the two clarifies how to use Routers.
