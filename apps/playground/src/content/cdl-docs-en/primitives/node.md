# node

`node` is the primitive that represents an individual part of a diagram.
You pick one of 29 `kind` values such as actor / function / storage / event and stack the nodes vertically inside a lane.
A single node expresses an entity such as a "person," a "process," or "data."

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.node(id: string, opts: {
  lane: string;             // owning lane id
  stack: number;            // vertical stack number (starts at 0)
  kind: NodeKind;           // 29 kinds (actor / function / storage / ...)
  title: string;
  subtitle?: string;
  eyebrow?: string;         // small label at the top
  value?: string;           // bottom-right value display for actor / storage ({stateId} interpolation supported)
  rows?: string[];          // storage rows ({stateId} interpolation supported)
  w?: number;               // width override
  h?: number;               // height override
})
```

@@@ llm 🤖 For LLM

```yaml
fn: .node
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
      - "referenced from edge.from / edge.to / phase.activate"
  - name: opts
    type: object
    required: true
    properties:
      lane: { type: string, required: true, hint: "existing lane id" }
      stack: { type: number, required: true, range: [0, 16], hint: "vertical index in the lane" }
      kind: { type: enum, required: true, values: [actor, function, storage, event, card, person, user-group, admin, developer, external-user, database, cache, queue, message-bus, cloud, cdn, service, api, frontend, backend, webhook, microservice, wallet, validator, miner, blockchain-node, mempool, block, bridge-node, relayer, signer, oracle, merkle-tree, decision] }
      title: { type: string, required: true, max: 32 }
      subtitle: { type: string, optional: true, max: 48 }
      eyebrow: { type: string, optional: true, max: 16, hint: "uppercase small label" }
      value: { type: string, optional: true, hint: "{stateId} interpolation, actor / storage only" }
      rows: { type: array<string>, optional: true, hint: "storage only, {stateId} interpolation" }
      w: { type: number, optional: true, range: [120, 480] }
      h: { type: number, optional: true, range: [60, 320] }
returns: DiagramBuilder
typical_use:
  - "individual element placement in a lane (actor / function / storage etc)"
  - "interpolating dynamic state into a node value or rows"
  - "horizontal alignment via shared stack number across lanes"
constraints:
  - "lane id must be declared before this node"
  - "rows is valid only when kind is 'storage'"
  - "value is valid only when kind is 'actor' or 'storage'"
  - "stack numbers within the same lane must be unique"
common_hallucinations:
  - '.node({ id: ..., lane: ... }) — opts is 2nd arg, not 1st'
  - '.node("a", "lane-l", 0, "actor", "Alice") — opts must be object'
  - 'kind: "rectangle" / "circle" — kind is semantic (29 values), not shape'
  - 'opts.x / opts.y — coordinates are derived from lane + stack, not direct'
  - 'rows / value on kind: "function" — only storage (rows) / actor / storage (value)'
```

:::

[preview:primitives/kind-actor]

## Arguments

| Argument | Type | Required | Purpose |
|---|---|---|---|
| `id` | `string` | Required | Unique ID that identifies the node. Referenced from the `from` / `to` of `edge` and from `phase.activate` |
| `lane` | `string` | Required | ID of the lane that owns the node |
| `stack` | `number` | Required | Vertical position within the lane (starts at 0; the same stack number aligns horizontally across every lane) |
| `kind` | `NodeKind` | Required | Pick one of 29 kinds that indicate the node meaning |
| `title` | `string` | Required | Main heading of the node |
| `subtitle` | `string` | Optional | Supplement text below the title |
| `eyebrow` | `string` | Optional | Small uppercase label at the top of the node |
| `value` | `string` | Optional | Value displayed prominently at the bottom right. You can interpolate `state` with `{stateId}` |
| `rows` | `string[]` | Optional | Table-style rows for storage. Supports `{stateId}` interpolation |
| `w` | `number` | Optional | Width override (px) |
| `h` | `number` | Optional | Height override (px) |

## Return value

Returns the DiagramBuilder.
You can chain further calls to `.node()` or `.edge()`.

## Design intent

> 💡 Why we limited `kind` to 29 values
> mermaid and PlantUML expose APIs where you specify the shape directly (rectangle / cylinder / cloud), whereas cdl specifies by meaning such as "actor," "function," or "storage."
> A meaning-based kind lets the design system consistently control shape and color, which keeps the neuromorphic-spine (neumorphism) look unified across every diagram.
> The 29 kinds split into the categories "people," "infrastructure," "application," "blockchain," and "cryptography," and cover every diagram type — sequence / flowchart / swimlane — with a single node API.

## Basics

The minimal code chooses the placement with `lane` and `stack`, and picks the look with `kind`.
When you use the same `stack` number across different lanes, the nodes line up horizontally.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "greet"
type: sequence

actors:
  - Alice
  - "greet()": function

flow:
  - Alice -> "greet()": "call"
```

@@@ llm 🤖 For LLM

```yaml
nodes:
  - { id: alice, lane: left,  stack: 0, kind: actor,    title: Alice }
  - { id: greet, lane: right, stack: 0, kind: function, title: "greet()" }
intent: identical stack: 0 across different lanes aligns horizontally (layout engine derives y)
```

:::

[preview:primitives/kind-actor]

In v0.5 Text DSL, you set the actor `kind` via the `name: kind` form.
The sequence preset lines up actors with horizontal lifelines, and each step in flow aligns horizontally by sharing the same stack number.

## Batch declaration

In v0.5 Text DSL, listing entries under `actors:` is itself a batch declaration.
In the chain API, `.nodes()` keeps the chain easier to read than declaring nodes individually.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "actors batch"
type: flow

actors:
  - Alice
  - Bob
  - "greet()": function
```

@@@ llm 🤖 For LLM

```yaml
nodes:
  - { id: a, lane: l, stack: 0, kind: actor,    title: Alice }
  - { id: b, lane: l, stack: 1, kind: actor,    title: Bob }
  - { id: c, lane: l, stack: 2, kind: function, title: "greet()" }
intent: batch declaration keeps the chain readable (avoids stacking individual .node() calls)
```

:::

## The 29 NodeKind values

Pick `kind` from the following 5 categories that hold 29 values in total.
You can preview the visual sample for every value at [`/catalog/primitives`](/catalog/primitives).

| Category | NodeKind | Purpose |
|---|---|---|
| Basic 5 | `actor` | Person / user |
| | `function` | API / function call |
| | `storage` | DB / state / mapping (rows display) |
| | `event` | emit event (scale + opacity motion) |
| | `card` | Generic card |
| People 5 | `person` / `user-group` / `admin` / `developer` / `external-user` | Detailed person classification |
| Infrastructure 6 | `database` / `cache` / `queue` / `message-bus` / `cloud` / `cdn` | Backend composition |
| Application 6 | `service` / `api` / `frontend` / `backend` / `webhook` / `microservice` | Application-layer composition |
| Blockchain 8 | `wallet` / `validator` / `miner` / `blockchain-node` / `mempool` / `block` / `bridge-node` / `relayer` | Blockchain-specific |
| Cryptography 4 | `signer` / `oracle` / `merkle-tree` / `decision` | Cryptography / decision |

## storage rows

When you pass `rows: ["key: value", ...]` to a node with `kind: "storage"`, the node renders as a table.
When you embed `state` with `{stateId}`, the value animates as the phase advances.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Vault"
type: sequence

actors:
  - Vault: storage

states:
  balance: 100

animation:
  - step: "transfer" 1.5s
    focus: [Vault]
    tween:
      balance: 100 -> 90
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: balance, initial: 100 }
nodes:
  - id: vault
    lane: p
    stack: 1
    kind: storage
    title: Vault
    rows:
      - "alice: {balance}"
      - "bob: 0"
intent: storage kind renders as a table; {stateId} interpolation syncs the value to phase progress
```

:::

[preview:primitives/kind-storage]

In v0.5 Text DSL, declaring an actor with `kind: storage` auto-binds state values to its rows.
When the phase tween changes `balance`, the storage table updates in sync via animation.
For fine-grained rows formatting (such as the `alice: {balance}` literal interpolation), use the chain API.

## actor value

When you pass `value: "{stateId}"` to a node with `kind: "actor"`, the value renders prominently at the bottom right.
Use it when you want a single number — such as a counter or a balance — to convey the actor's state.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "User Supply"
type: sequence

actors:
  - User

states:
  supply: 0

animation:
  - step: "mint" 1.2s
    focus: [User]
    tween:
      supply: 0 -> 100
```

@@@ llm 🤖 For LLM

```yaml
states:
  - { id: supply, initial: 0 }
nodes:
  - { id: user, lane: u, stack: 0, kind: actor, title: User, value: "{supply}" }
intent: actor kind exposes a large bottom-right value; one number conveys the actor's state
```

:::

In v0.5 Text DSL, declaring states plus a tween automatically updates the actor's value.
Use the chain API when you need fine-grained control over which state binds to which actor's value (such as the `value: "{supply}"` literal pattern).

## stack number

When you increase `stack: 0, 1, 2, ...` within the same lane, the nodes stack vertically.
When you use the same stack number across different lanes, the nodes align horizontally.

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "horizontal align"
type: sequence

actors:
  - Alice
  - greet: function
  - OK: event

flow:
  - Alice -> greet: "call"
  - greet -> OK: "emit"
```

@@@ llm 🤖 For LLM

```yaml
nodes:
  - { id: alice,  lane: l, stack: 0, kind: actor,    title: Alice }   # top
  - { id: greet,  lane: r, stack: 0, kind: function, title: greet }   # top (aligned with alice)
  - { id: result, lane: r, stack: 1, kind: event,    title: OK }      # bottom
intent: same stack = horizontal alignment, incrementing stack within one lane = vertical stack (order only; the layout engine derives y)
```

:::

In v0.5 Text DSL, you do not specify `stack` explicitly — the layout engine derives it from the actor declaration order and the chronological order of flow.

> 💡 Why the stack number decides the y position
> If we exposed y coordinates directly on the API, we would have to recompute the entire layout every time you add or remove a node.
> The stack number lets you declare only the order, and the layout engine computes the heights automatically.

## subtitle / eyebrow

We expose two fields that show supplementary text for the title.
Each one has a different display position and purpose.

| field | Display position | Purpose |
|---|---|---|
| `eyebrow` | Small uppercase label at the top of the node | Kind identification (for example `STATE` / `ENTITY`) |
| `subtitle` | Supplement text below the title | Supplementary explanation (for example `signature only (gas 0)`) |

::: tabs

@@@ humans 👤 For humans (EN)

```text
title: "Owner Node"
type: sequence

actors:
  - Owner
```

@@@ llm 🤖 For LLM

```yaml
nodes:
  - id: owner
    lane: o
    stack: 0
    kind: actor
    title: Owner
    eyebrow: USER                      # small uppercase label at the top (kind cue)
    subtitle: "signature only (gas 0)" # supplementary line below the title
intent: layer the title in 3 tiers using eyebrow (top uppercase) and subtitle (bottom supplement)
```

:::

[preview:primitives/kind-actor]

v0.5 Text DSL cannot express `eyebrow` / `subtitle` directly; use the chain API for those supplementary displays.

## API Reference (chain API)

When you need overrides such as `eyebrow` / `subtitle` / `rows` literal interpolation / `w` / `h` that v0.5 Text DSL cannot express, use the builder API.

```ts
.node("alice", { lane: "left", stack: 0, kind: "actor", title: "Alice" })
.node("greet", { lane: "right", stack: 0, kind: "function", title: "greet()" })

.nodes([
  { id: "a", lane: "l", stack: 0, kind: "actor",    title: "Alice" },
  { id: "b", lane: "l", stack: 1, kind: "actor",    title: "Bob" },
  { id: "c", lane: "l", stack: 2, kind: "function", title: "greet()" },
])

.state("balance", { initial: 100 })
.node("vault", {
  lane: "p",
  stack: 1,
  kind: "storage",
  title: "Vault",
  rows: ["alice: {balance}", "bob: 0"],
})

.state("supply", { initial: 0 })
.node("user", { lane: "u", stack: 0, kind: "actor", title: "User", value: "{supply}" })

.node("owner", {
  lane: "o", stack: 0,
  kind: "actor",
  title: "Owner",
  eyebrow: "USER",
  subtitle: "signature only (gas 0)",
})
```

## Related

- [lane](/docs/en/cdl/primitives/lane) — column that contains nodes
- [edge](/docs/en/cdl/primitives/edge) — relation between nodes
- [state](/docs/en/cdl/primitives/state) — referenced from `node.value` or `node.rows`
- [API Reference](/docs/en/cdl/reference/api#node) — type definitions for every field
