# state

`state` is the primitive that represents a variable whose value changes as phases progress.
You reference it from `node.value` or `node.rows` with the `{stateId}` notation, and when you transition the value with the phase's `tween` / `set`, the change is reflected on screen as an animation.
Use it to express dynamic values such as counters, balances, or status flags.

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.state(id: string, opts: {
  initial: number | string;     // initial value (when the animation starts)
})
```

@@@ llm 🤖 For LLM

```yaml
fn: .state
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
      - "referenced via {stateId} interpolation in node.value / node.rows"
  - name: opts
    type: object
    required: true
    properties:
      initial: { type: number | string, required: true, hint: "number for tween, string for set-only flag" }
returns: DiagramBuilder
typical_use:
  - "counter / balance with phase.tween linear interpolation"
  - "status flag (idle / loading / done) with phase.set immediate switch"
  - "synchronized multi-state transition in a single phase"
constraints:
  - "tween requires initial to be number"
  - "set accepts both number and string values"
  - "{stateId} interpolation lives in node.value (actor / storage) or node.rows (storage)"
  - "phase tween chains carry the prior phase end value into the next start value"
common_hallucinations:
  - '.state({ id: ..., initial: ... }) — opts is 2nd arg, not 1st'
  - '.state("c", 0) — opts must be object with initial key'
  - 'opts.type: "number" — type is inferred from initial'
  - 'opts.min / opts.max — no clamp option, define range via tween from / to'
  - '${stateId} / {{stateId}} — interpolation syntax is {stateId} single brace'
```

:::

## Arguments

| Argument | Type | Required | Purpose |
|---|---|---|---|
| `id` | `string` | Required | Unique ID that identifies the state. Referenced with the `{stateId}` notation |
| `initial` | `number \| string` | Required | Initial value when the animation starts |

## Return value

Returns the DiagramBuilder.
You can chain further calls to `.node()` or `.phase()`.

## Design intent

> 💡 Why we made state an independent primitive
> Static diagrams (mermaid and so on) require you to line up multiple figures such as "phase 1: balance = 100" and "phase 2: balance = 90" to express numeric change.
> cdl makes state an independent primitive — declare `tween` to interpolate from 0 to 1, and it generates an animation that smoothly changes the balance or counter.
> The fact that a single diagram can express "the motion of state" is why cdl fits video and presentation use cases.

## Basics

The minimal code declares a `state`, embeds `{stateId}` in `node.value`, and transitions the value with `phase.tween` in three steps.
While the phase plays, `{count}` is linearly interpolated from `0` to `1` and rendered.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Counter"
type: sequence

actors:
  - Counter

states:
  count: 0

animation:
  - step: "+1" 1.5s
    focus: [Counter]
    tween:
      count: 0 -> 1
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: counter, topic: Counter }
lanes:
  - { id: l, x: 0, width: 400 }
states:
  - { id: count, initial: 0 }
nodes:
  - { id: c, lane: l, stack: 0, kind: actor, title: Counter, value: "{count}" }
phases:
  - id: inc
    duration_ms: 1500
    title: "+1"
    activates: [c]
    tweens:
      - { state: count, from: 0, to: 1 }
intent: counter is linearly interpolated 0 -> 1 as the phase progresses
```

:::

[preview:animation/mixed-tween-set]

## tween (linear interpolation of numbers)

`PhaseBuilder.tween(stateId, from, to)` interpolates from 0% to 100% across the full duration.
While the phase plays, `{balance}` changes smoothly as `100, 99.3, 98.7, ..., 90.0`.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "transfer"
type: sequence

actors:
  - acc

states:
  balance: 100

animation:
  - step: "transfer" 1.5s
    focus: [acc]
    tween:
      balance: 100 -> 90
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: balance, initial: 100 }
phases:
  - id: transfer
    duration_ms: 1500
    title: transfer
    activates: [acc]
    tweens:
      - { state: balance, from: 100, to: 90, interpolation: linear }
```

:::

[preview:animation/tween-simple]

## set (instant switch, no lerp)

Use `.set()` for string states or when you want an instant switch instead of interpolation.
Use it for values where interpolation has no meaning, such as a status flag (`idle` -> `loading` -> `done`).

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "status flag"
type: flow

actors:
  - fn: function

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [fn]
    set:
      status: "loading"
  - step: "done" 1.2s
    focus: [fn]
    set:
      status: "done"
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: status, initial: "idle" }
phases:
  - id: submit
    duration_ms: 800
    title: submit
    activates: [fn]
    sets:
      - { state: status, to: "loading" }
  - id: done
    duration_ms: 1200
    title: done
    activates: [fn]
    sets:
      - { state: status, to: "done" }
```

:::

## Accumulating across phases

When you tween the same state across multiple phases, the end value of one phase becomes the start value of the next.
To express continuous accumulation, declare the value explicitly per phase so the per-phase meaning stays clear.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "accumulating sum"
type: flow

actors:
  - sum_node

states:
  sum: 0

animation:
  - step: "p1" 1s
    focus: [sum_node]
    tween:
      sum: 0 -> 10
  - step: "p2" 1s
    focus: [sum_node]
    tween:
      sum: 10 -> 50
  - step: "p3" 1s
    focus: [sum_node]
    tween:
      sum: 50 -> 100
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: sum, initial: 0 }
phases:
  - { id: p1, tweens: [{ state: sum, from: 0,  to: 10  }] }
  - { id: p2, tweens: [{ state: sum, from: 10, to: 50  }] }  # accumulating
  - { id: p3, tweens: [{ state: sum, from: 50, to: 100 }] }
note: "the end value of each phase = the start value of the next; declaring from values explicitly preserves continuity"
```

:::

## Referencing from node.value

When you specify `value: "{stateId}"` on a node with `kind: "actor"`, the value renders prominently at the bottom right.
Use it when you want a single number — such as a balance or counter — to convey the actor's state.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "User balance"
type: sequence

actors:
  - User

states:
  balance: 100
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: balance, initial: 100 }
nodes:
  - { id: user, lane: u, stack: 0, kind: actor, title: User, value: "{balance}" }
interpolation_syntax: "{stateId}"  # ${...} / {{...}} are invalid
```

:::

v0.5 Text DSL cannot express the `value: "{stateId}"` literal interpolation directly; use the chain API for fine-grained value patterns.

## Referencing from node.rows

When you specify `rows: ["key: {stateId}", ...]` on a node with `kind: "storage"`, you can embed values into table-style rows.
You can express multiple keyed values at the same time, just like a DB table or a mapping type.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Vault rows"
type: sequence

actors:
  - Vault: storage

states:
  alice_bal: 100
  bob_bal: 0
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: alice_bal, initial: 100 }
  - { id: bob_bal,   initial: 0   }
nodes:
  - id: vault
    lane: p
    stack: 1
    kind: storage
    title: Vault
    rows:
      - "alice: {alice_bal}"
      - "bob: {bob_bal}"
```

:::

In v0.5 Text DSL, an actor with `kind: storage` plus the states block auto-binds, but for fine-grained rows literal patterns (such as `"alice: {alice_bal}"`), use the chain API.

[preview:animation/mixed-tween-set]

## Simultaneous transitions of multiple states

You can tween multiple states at the same time within a single phase.
This lets you express a transfer — "one side decreases and the other increases" — within a single phase.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "parallel transfer"
type: sequence

actors:
  - vault: storage

states:
  alice_bal: 100
  bob_bal: 0

animation:
  - step: "transfer" 1.5s
    focus: [vault]
    tween:
      alice_bal: 100 -> 90
      bob_bal: 0 -> 10
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: transfer
    duration_ms: 1500
    title: transfer
    activates: [vault]
    tweens:
      - { state: alice_bal, from: 100, to: 90 }
      - { state: bob_bal,   from: 0,   to: 10 }
note: "place multiple states under tweens within a single phase to lerp them in parallel under the same duration"
```

:::

## API Reference (chain API)

Use the builder API for literal interpolation patterns such as `value: "{stateId}"` / `rows: ["k: {stateId}"]` that v0.5 Text DSL cannot express.

```ts
diagram("counter", { topic: "Counter" })
  .lane("l", { x: 0, width: 400 })
  .state("count", { initial: 0 })
  .node("c", { lane: "l", stack: 0, kind: "actor", title: "Counter", value: "{count}" })
  .phase("inc", { duration: 1500, title: "+1", body: "" },
    (p) => p.activate("c").tween("count", 0, 1))
  .build();

.state("balance", { initial: 100 })
.phase("transfer", { duration: 1500, title: "transfer", body: "" },
  (p) => p.activate("acc").tween("balance", 100, 90))

.state("status", { initial: "idle" })
.phase("submit", { duration: 800, title: "submit", body: "" },
  (p) => p.activate("fn").set("status", "loading"))
.phase("done", { duration: 1200, title: "done", body: "" },
  (p) => p.activate("fn").set("status", "done"))

.state("sum", { initial: 0 })
.phase("p1", { ... }, (p) => p.tween("sum", 0, 10))      // 0 -> 10
.phase("p2", { ... }, (p) => p.tween("sum", 10, 50))     // 10 -> 50 (accumulating)
.phase("p3", { ... }, (p) => p.tween("sum", 50, 100))    // 50 -> 100

.state("balance", { initial: 100 })
.node("user", { lane: "u", stack: 0, kind: "actor", title: "User", value: "{balance}" })

.state("alice_bal", { initial: 100 })
.state("bob_bal",   { initial: 0 })
.node("vault", {
  lane: "p", stack: 1, kind: "storage", title: "Vault",
  rows: ["alice: {alice_bal}", "bob: {bob_bal}"],
})

.phase("transfer", { duration: 1500, title: "transfer", body: "" },
  (p) => p.activate("vault")
    .tween("alice_bal", 100, 90)
    .tween("bob_bal", 0, 10)
)
```

## Related

- [phase](/docs/en/cdl/primitives/phase) — the unit that transitions a state
- [node](/docs/en/cdl/primitives/node) — references state from `node.value` / `rows`
- [API Reference](/docs/en/cdl/reference/api#state) — type definitions for every field
