# state

`state` は phase 進行で値が変化する変数を表す primitive です。
`node.value` や `node.rows` から `{stateId}` 記法で参照し、 phase の `tween` / `set` で値を遷移させると、 画面に animation で反映されます。
カウンター / 残高 / status flag など、 動的な値を表現する用途で使います。

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.state(id: string, opts: {
  initial: number | string;     // 初期値 (animation 開始時)
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

## 引数

| 引数 | 型 | 必須 | 用途 |
|---|---|---|---|
| `id` | `string` | 必須 | state を識別する一意の ID。 `{stateId}` 記法で参照します |
| `initial` | `number \| string` | 必須 | animation 開始時の初期値 |

## 戻り値

DiagramBuilder を返します。
chain で続けて `.node()` や `.phase()` を呼び出せます。

## 設計意図

> 💡 なぜ state を primitive として独立させたか
> 静的な diagram (mermaid 等) では、 数値の変化を表現するために 「phase 1: balance = 100」 「phase 2: balance = 90」 のような複数の図を並べる必要があります。
> cdl は state を primitive として独立させ、 `tween` で 0 → 1 の補間を宣言するだけで、 残高や counter が滑らかに変化する animation を生成します。
> 1 つの diagram で「状態の動き」 を表現できるのが、 cdl が動画 / プレゼン用途に向く理由です。

## 基本

最小コードは `state` を宣言し、 `node.value` で `{stateId}` を埋め込み、 `phase.tween` で値を遷移させる 3 ステップです。
phase 進行中、 `{count}` が `0` から `1` まで線形補間されて render されます。

::: tabs

@@@ humans 👤 For humans

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
intent: counter が phase 進行で 0 -> 1 に線形補間
```

:::

[preview:animation/mixed-tween-set]

## tween (数値の線形補間)

`PhaseBuilder.tween(stateId, from, to)` で 0% から 100% を duration 全体で補間します。
phase 進行中、 `{balance}` が `100, 99.3, 98.7, ..., 90.0` のように滑らかに変化します。

::: tabs

@@@ humans 👤 For humans

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

## set (即時切替、 lerp なし)

文字列 state や、 補間でなく瞬間切替したいときは `.set()` を使います。
status flag (`idle` → `loading` → `done`) など、 補間に意味がない値で使います。

::: tabs

@@@ humans 👤 For humans

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

## 連続 phase の累積

複数 phase で同じ state を tween すると、 各 phase の終値が次 phase の開始値になります。
連続した累積を表現するときに、 個別 phase で値を明示することで、 phase 単位の意味付けが明確になります。

::: tabs

@@@ humans 👤 For humans

```text
title: "累積 sum"
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
  - { id: p2, tweens: [{ state: sum, from: 10, to: 50  }] }  # 累積
  - { id: p3, tweens: [{ state: sum, from: 50, to: 100 }] }
note: "各 phase 終値 = 次 phase 開始値 (連続性は from 値の明示で担保)"
```

:::

## node.value で参照

`kind: "actor"` の node で `value: "{stateId}"` を指定すると、 右下に大きく値を表示します。
残高や counter など、 1 つの数値で actor の状態を示すときに使います。

::: tabs

@@@ humans 👤 For humans

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
interpolation_syntax: "{stateId}"  # ${...} / {{...}} は無効
```

:::

v0.5 Text DSL では `value: "{stateId}"` 形式の literal interpolation を直接表現できないため、 細かい value pattern は chain API で指定します。

## node.rows で参照

`kind: "storage"` の node で `rows: ["key: {stateId}", ...]` を指定すると、 表形式の行に値を埋め込めます。
DB の table や mapping 型のように、 複数 key の値を同時に表現できます。

::: tabs

@@@ humans 👤 For humans

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

v0.5 Text DSL では `kind: storage` の actor 宣言 + states 群で auto-bind されますが、 rows の literal pattern (`"alice: {alice_bal}"`) を細かく制御したい場合は chain API を使います。

[preview:animation/mixed-tween-set]

## 複数 state の同時遷移

1 phase で複数 state を同時に tween できます。
transfer のように「片方が減って片方が増える」 動作を、 1 つの phase で表現します。

::: tabs

@@@ humans 👤 For humans

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
note: "1 phase 内 tweens 配列に複数 state を並列指定可、 全て同 duration で同期 lerp"
```

:::

## API Reference (chain API)

v0.5 Text DSL で表現できない `value: "{stateId}"` / `rows: ["k: {stateId}"]` 等の literal interpolation pattern を扱う場合は builder API を使います。

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
.phase("p1", { ... }, (p) => p.tween("sum", 0, 10))      // 0 → 10
.phase("p2", { ... }, (p) => p.tween("sum", 10, 50))     // 10 → 50 (累積)
.phase("p3", { ... }, (p) => p.tween("sum", 50, 100))    // 50 → 100

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

## 関連

- [phase](/docs/cdl/primitives/phase) ... state を遷移させる単位です
- [node](/docs/cdl/primitives/node) ... `node.value` / `rows` で state を参照します
- [API Reference](/docs/cdl/reference/api#state) ... 全 field の型定義です
