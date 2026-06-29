# How to diagram a cross-chain Bridge (Lock-Mint)

[preview:patterns/pattern-bridge]

A Bridge moves value across chains by **locking the asset on the source chain and minting the same amount on a different chain**.
This is called the Lock-Mint approach, and it is used by many bridges, including WBTC and the legacy Polygon PoS bridge.
A central relayer (or a validator set) carries the cross-chain message so that balances on the source and destination chains stay in sync.

This page shows you how to split the picture into three lanes (source chain, bridge, destination chain) and replay the lock -> relay -> mint flow as three phases.

## Prerequisites

This guide assumes you have done the following.

- You have skimmed the cdl [`diagram()` / `lane()` / `nodes()` / `state()` / `phase()` API](/docs/en/cdl/primitives).
- You know the concept of a cross-chain bridge, where the same token exists on both the source and destination chain.
- You know what the ERC-20 `lock` and `mint` functions do.

A mermaid `sequenceDiagram` can express the flow across three chains, but it cannot make the **chain boundary** visually obvious.
Wrapping the source and destination lanes in cdl with `contain: true` represents each chain as its own self-contained world.

## Steps

You stand up three lanes (source, bridge, dest), place six nodes in them, and connect them with five edges.
Declare the state as two separate values, `locked` (source chain) and `minted` (destination chain), and tween them in order inside each phase.

Copy the code below as-is and the finished diagram runs.

::: tabs

@@@ humans 👤 For humans

```text
title: "Bridge Lock-Mint"
type: swimlane

actors:
  - User
  - "lock(amt)": function
  - Vault: storage
  - Relayer: function
  - "mint(amt)": function
  - Receiver

flow:
  - User -> "lock(amt)": "lock" (dotted-flow)
  - "lock(amt)" -> Vault: "store" (teal, dotted-flow)
  - "lock(amt)" -> Relayer: "msg" (info, dotted-flow)
  - Relayer -> "mint(amt)": "relay" (info, dotted-flow)
  - "mint(amt)" -> Receiver: "send" (success, dotted-flow)

states:
  locked: 0
  minted: 0

animation:
  - step: "Source: lock" 1.8s
    focus: [User, "lock(amt)", Vault]
    tween:
      locked: 0 -> 10
    badge: "locked"

  - step: "Relayer: msg pass" 1.8s
    focus: ["lock(amt)", Relayer, "mint(amt)"]
    badge: "relay"

  - step: "Dest: mint + send" 1.8s
    focus: ["mint(amt)", Receiver]
    tween:
      minted: 0 -> 10
    badge: "minted"
```

@@@ llm 🤖 For LLM

```yaml
diagram: bridge
topic: "Bridge Lock-Mint"
lanes:
  - { id: src, x: 0,    width: 280, contain: true }
  - { id: br,  x: 540,  width: 380 }
  - { id: dst, x: 1140, width: 280, contain: true }
state:
  - { id: locked, initial: 0 }
  - { id: minted, initial: 0 }
nodes:
  - { id: user,    lane: src, stack: 0, kind: actor,    title: "User" }
  - { id: lockFn,  lane: src, stack: 1, kind: function, title: "lock(amt)" }
  - { id: vault,   lane: src, stack: 2, kind: storage,  title: "Vault",     rows: ["locked: {locked}"] }
  - { id: relayer, lane: br,  stack: 0, kind: function, title: "Relayer",   subtitle: "message" }
  - { id: mintFn,  lane: dst, stack: 0, kind: function, title: "mint(amt)" }
  - { id: recv,    lane: dst, stack: 1, kind: actor,    title: "Receiver",  value: "{minted}" }
edges:
  - { from: user,    to: lockFn,  label: "lock",  style: dotted-flow }
  - { from: lockFn,  to: vault,   label: "store", tone: teal,    style: dotted-flow }
  - { from: lockFn,  to: relayer, label: "msg",   tone: info,    style: dotted-flow }
  - { from: relayer, to: mintFn,  label: "relay", tone: info,    style: dotted-flow }
  - { from: mintFn,  to: recv,    label: "send",  tone: success, style: dotted-flow }
phases:
  - { id: lock,  duration: 1800, title: "Source: lock",      body: "Lock the asset into the vault on the source chain.",            activate: [user, lockFn, vault, user-lockFn, lockFn-vault], tween: [{ state: locked, from: 0, to: 10 }], badge: "locked" }
  - { id: relay, duration: 1800, title: "Relayer: msg pass", body: "The bridge relayer carries the cross-chain message.",          activate: [lockFn, relayer, mintFn, lockFn-relayer, relayer-mintFn], badge: "relay" }
  - { id: mint,  duration: 1800, title: "Dest: mint + send", body: "Mint the same amount on the destination chain and send it to the receiver.", activate: [mintFn, recv, mintFn-recv], tween: [{ state: minted, from: 0, to: 10 }], badge: "minted" }
```

:::

The code above starts with `User -> lock(amt) -> Vault` on the source chain, lets the central relayer carry the cross-chain message, and lands on `mint(amt) -> Receiver` on the destination chain, replaying the whole thing as three phases.
Applying `contain: true` to both the src and dst lanes wraps the chain boundary in a frame so the reader sees "everything past this line is a different chain" at a glance.

v0.5 Text DSL cannot set lane `x` / `width` / `contain` (the chain-boundary frame), or per-node `stack` / `subtitle` / `rows` / `value`.
When you need a strict reproduction with the framed chain boundaries and numeric display inside the Vault (`rows`), reach for the chain API below.

## API Reference (chain API)

v0.5 Text DSL cannot express physical lane positions (`x` / `width` / `contain`) or per-node `stack` / `subtitle` / `rows` / `value`, so use the chain API below when you need framed chain boundaries or numeric display of `locked` inside the Vault.

```ts
import { diagram } from "@cardenelabs/cdl";

export const bridge = diagram("bridge", { topic: "Bridge Lock-Mint" })
  .lane("src", { x: 0,    width: 280, contain: true })
  .lane("br",  { x: 540,  width: 380 })
  .lane("dst", { x: 1140, width: 280, contain: true })
  .state("locked", { initial: 0 })
  .state("minted", { initial: 0 })
  .nodes([
    { id: "user",    lane: "src", stack: 0, kind: "actor",    title: "User" },
    { id: "lockFn",  lane: "src", stack: 1, kind: "function", title: "lock(amt)" },
    { id: "vault",   lane: "src", stack: 2, kind: "storage",  title: "Vault", rows: ["locked: {locked}"] },
    { id: "relayer", lane: "br",  stack: 0, kind: "function", title: "Relayer", subtitle: "message" },
    { id: "mintFn",  lane: "dst", stack: 0, kind: "function", title: "mint(amt)" },
    { id: "recv",    lane: "dst", stack: 1, kind: "actor",    title: "Receiver", value: "{minted}" },
  ])
  .edges([
    { from: "user",    to: "lockFn",  label: "lock",  style: "dotted-flow" },
    { from: "lockFn",  to: "vault",   label: "store", tone: "teal", style: "dotted-flow" },
    { from: "lockFn",  to: "relayer", label: "msg",   tone: "info", style: "dotted-flow" },
    { from: "relayer", to: "mintFn",  label: "relay", tone: "info", style: "dotted-flow" },
    { from: "mintFn",  to: "recv",    label: "send",  tone: "success", style: "dotted-flow" },
  ])
  .phase("lock",  { duration: 1800, title: "Source: lock",      body: "Lock the asset into the vault on the source chain." },
    (p) => p.activate("user", "lockFn", "vault", "user-lockFn", "lockFn-vault").tween("locked", 0, 10).badge("locked"))
  .phase("relay", { duration: 1800, title: "Relayer: msg pass", body: "The bridge relayer carries the cross-chain message." },
    (p) => p.activate("lockFn", "relayer", "mintFn", "lockFn-relayer", "relayer-mintFn").badge("relay"))
  .phase("mint",  { duration: 1800, title: "Dest: mint + send", body: "Mint the same amount on the destination chain and send it to the receiver." },
    (p) => p.activate("mintFn", "recv", "mintFn-recv").tween("minted", 0, 10).badge("minted"))
  .build();
```

## Pattern metadata (for LLM)

Complete declarative metadata that lets an LLM mechanically process the pattern.

```yaml
pattern: bridge
intent: "cross-chain Lock-Mint bridge — lock asset on source chain, relayer carries message, mint same amount on destination chain"
lanes:
  - { id: src, role: "Source chain (asset originates here)",            x: 0,    width: 280, contain: true }
  - { id: br,  role: "Bridge relay path (off-chain or validator set)",  x: 540,  width: 380 }
  - { id: dst, role: "Destination chain (mint occurs here)",            x: 1140, width: 280, contain: true }
state:
  - { id: locked, initial: 0, purpose: "amount locked in source-chain Vault" }
  - { id: minted, initial: 0, purpose: "amount minted on destination chain to Receiver" }
nodes:
  - { id: user,    lane: src, stack: 0, kind: actor,    title: "User",      purpose: "initiates bridge tx on source chain" }
  - { id: lockFn,  lane: src, stack: 1, kind: function, title: "lock(amt)", purpose: "source-chain entrypoint that locks asset" }
  - { id: vault,   lane: src, stack: 2, kind: storage,  title: "Vault",     purpose: "holds locked asset on source chain" }
  - { id: relayer, lane: br,  stack: 0, kind: function, title: "Relayer",   purpose: "carries cross-chain message src → dst" }
  - { id: mintFn,  lane: dst, stack: 0, kind: function, title: "mint(amt)", purpose: "destination-chain entrypoint that mints asset" }
  - { id: recv,    lane: dst, stack: 1, kind: actor,    title: "Receiver",  purpose: "final destination of minted asset" }
edges:
  - { from: user,    to: lockFn,  label: "lock",  tone: default, role: "user invokes lock on source" }
  - { from: lockFn,  to: vault,   label: "store", tone: teal,    role: "asset persisted in vault storage" }
  - { from: lockFn,  to: relayer, label: "msg",   tone: info,    role: "lock event emits cross-chain message" }
  - { from: relayer, to: mintFn,  label: "relay", tone: info,    role: "relayer delivers message to dst chain" }
  - { from: mintFn,  to: recv,    label: "send",  tone: success, role: "minted asset transferred to receiver" }
phases:
  - { id: lock,  title: "Source: lock",      body: "Lock asset into vault on source chain.",                 duration_ms: 1800, activates: [user, lockFn, vault, user-lockFn, lockFn-vault], tweens: [{ state: locked, from: 0, to: 10 }], badge: "locked" }
  - { id: relay, title: "Relayer: msg pass", body: "Bridge relayer carries the cross-chain message.",        duration_ms: 1800, activates: [lockFn, relayer, mintFn, lockFn-relayer, relayer-mintFn], badge: "relay" }
  - { id: mint,  title: "Dest: mint + send", body: "Mint same amount on dst chain and send to receiver.",    duration_ms: 1800, activates: [mintFn, recv, mintFn-recv], tweens: [{ state: minted, from: 0, to: 10 }], badge: "minted" }
critical_design_points:
  - "Split source / bridge / destination into 3 lanes so the chain boundary is physically expressed by lane separation"
  - "Apply contain: true to both src and dst lanes so the frame signals 'past this line is a different chain' at a glance"
  - "Declare locked and minted as separate states so 'source balance never decreases, fresh one is minted on dst' lands through the balance display"
  - "Enforce lock → relay → mint ordering across 3 phases (breaking the order breaks the bridge)"
common_mistakes:
  - "Putting contain on the relayer lane — makes it look like 'a third chain' (relayer is a relay path, leave contain off)"
  - "Collapsing locked and minted into a single state — erases the fact that source and destination carry parallel balances"
  - "Stuffing all motion into one phase — the lock → relay → mint timeline becomes invisible"
  - "Removing contain from src / dst — chain boundary vanishes and everything looks like one world"
related_patterns:
  - "permit — same 3-lane plus 3-phase shape applied to off-chain signature"
  - "approve-pull — analogous structure of wrapping a center lane with contain and stacking internals vertically"
```

## Verification

Open the diagram in your browser. You know it works when you see the following.

- A frame (contain) appears on the two src and dst lanes.
- Phase 1 (lock) flows particles along User -> lock() -> Vault, and `locked` inside the Vault moves from **0 to 10**.
- Phase 2 (relay) flows particles through the Relayer in the central Bridge lane and lands on mint().
- Phase 3 (mint) moves the Receiver's value from **0 to 10**, and the "minted" badge appears.

If `locked` or `minted` does not move, check that the `tween()` calls in each phase match the state declarations.

[preview:patterns/pattern-bridge]

## Why you write it this way

The first thing people stumble on when reading bridge docs is the question **"Does the asset physically move, or is a new one minted on the other chain?"**
The Lock-Mint approach is the latter: the asset on the source chain stays locked in place, and the same amount is freshly minted on the destination chain.
To communicate this fact, cdl uses a structure with two separate states.

There are four design points.

- **Split into three lanes**, because the source chain and destination chain are different worlds. You wedge the bridge lane in the middle to physically separate them.
- **Wrap the chain boundary with `contain: true`**, so a frame on the src and dst lanes signals "past this line is a different chain" at a glance.
- **Show the order in three phases**, because lock -> relay -> mint must run in that order or the bridge does not work. The phase split makes the timeline explicit.
- **Carry two states**, because keeping `locked` and `minted` separate makes "the source-chain balance is not reduced; a fresh one is born on the destination chain" land through the balance display alone.

You do not put `contain` on the relayer lane, because the relayer is not a chain, just a relay path.
Wrapping it in a frame would make it look like "a third chain," so you raise the lane but leave contain off.

## Related docs

- The [patterns index](/docs/en/cdl/patterns/README) lets you browse the other patterns.
- [Permit](/docs/en/cdl/patterns/permit) uses the same three-lane plus three-phase shape, and comparing the two clarifies how lanes get used.
- [Cookbook example 7](/docs/en/cdl/overview/cookbook) walks you through a full implementation of CCTP (the USDC-specific burn-mint path).
