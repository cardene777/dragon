# swimlane preset

`swimlane` preset は横並びの複数 `lane` (列) を lane 名の配列だけで宣言する高位 API です。
著者は lane 名を文字列配列で渡すだけで、 lane の `x` 座標 / 幅 / label slug は engine が auto 計算します。

mermaid `flowchart LR` で複数の `subgraph` を横並びに置く構成と概念的に等価です。
並列に動く actor や system を 1 枚の図に並べる用途に最適化されています。

## いつ使うか

`swimlane` は横方向に役割の異なる actor や system が並ぶ場合に最適です。
3 から 5 lane 程度の中規模 flow で、 lane の `x` や `width` を手で計算したくないときに使ってください。

- 横方向に役割の異なる actor や system が並ぶ図を描きたい
- 3 から 5 lane 程度の中規模 flow を 1 枚にまとめたい
- lane の `x` 座標と `width` を手計算したくない

mermaid `flowchart LR` で `subgraph` を並列に置く構成と同等のことが、 配列 1 つで宣言できます。

## いつ使わないか

単一 lane や時系列が主役の図には別の preset が向きます。
無理に `swimlane` で表現すると lane が 1 つになって preset の利点が出ません。

- 単一 lane で縦並びの workflow には [flow preset](/docs/cdl/presets/flow) を使ってください
- UML sequence diagram のような時系列メッセージ往復には [sequence preset](/docs/cdl/presets/sequence) を使ってください
- system 構成図には [topology preset](/docs/cdl/presets/topology) を使ってください

## なぜ専用 preset を分けたか

低位 API (`primitives` で `lane` を 1 つずつ宣言する経路) で 3 lane の図を作ると、 lane ごとに `x` 座標と `width` と label slug を計算する宣言が必要で、 lane 宣言だけで 10 行を超えます。
`swimlane` preset はこれを「lane 名の配列 1 行」 に圧縮して、 lane gap や label clearance も engine が auto 調整します。

> mermaid との違い ... mermaid `flowchart LR` + `subgraph` は subgraph の幅を engine に任せられますが、 sub の中の node 配置は手で書きます。 cdl `swimlane` は lane.x / width に加えて、 lane id (slug) や日本語 label の正規化も auto で処理します。

## Signature

::: tabs

@@@ humans 👤 For humans

`swimlane` 図は v0.5 Text DSL で `type: swimlane` を指定し、 `actors` に lane を並列に並べ、 `flow` で lane 間の矢印を書きます。

```text
title: "<diagram 題名>"
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

v0.5 Text DSL では 1 lane = 1 actor 単位で並べ、 lane の `x` 座標 / `laneWidth` / `contain` (枠付き) は engine が自動計算します。
1 lane に複数 node を `stack` で縦並びにしたい場合は本ページ末尾の「API Reference (chain API)」 section を参照してください。

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

## 引数

`swimlane` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier、 同一 page 内で一意 |
| `topic` | `string` | 必須 | 図上部に描画される題名 |
| `lanes` | `string[]` | 必須 | 上端に並ぶ lane label、 配列の順序 = 左から右の並び |
| `laneWidth` | `number` | 任意 | 1 lane あたりの幅 px、 default `400` |
| `contain` | `boolean` | 任意 | `true` で全 lane を枠付きで描画 |

## 基本例

3 lane (`Sender` / `Contract` / `Receiver`) で ERC20 transfer の流れを組む完全例です。

::: tabs

@@@ humans 👤 For humans (JA)

```text
title: "ERC20 Transfer"
type: swimlane

actors:
  - Alice
  - "transfer()": function
  - Bob

flow:
  - Alice -> "transfer()": "call"
  - "transfer()" -> Bob: "emit" (success, dotted-flow)

animation:
  - step: "call" 1.5s
    focus: [Alice, "transfer()"]
    badge: "call"

  - step: "emit" 1.5s
    focus: ["transfer()", Bob]
    badge: "emit"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: transfer, topic: "ERC20 Transfer" }
lanes: [Sender, Contract, Receiver]
nodes:
  - { id: alice, lane: Sender,   stack: 0, kind: actor,    title: Alice }
  - { id: fn,    lane: Contract, stack: 0, kind: function, title: "transfer()" }
  - { id: bob,   lane: Receiver, stack: 0, kind: actor,    title: Bob }
edges:
  - { from: alice, to: fn,  label: call }
  - { from: fn,    to: bob, label: emit, tone: success, style: dotted-flow }
phases:
  - { id: call, duration_ms: 1500, title: call, body: "Alice が transfer を呼ぶ。", activates: [alice, fn, alice-fn] }
  - { id: emit, duration_ms: 1500, title: emit, body: "Bob へ通知。", activates: [fn, bob, fn-bob] }
intent: 3 lane 並列 + 2 phase animation で ERC20 transfer の往復を可視化
note: "node.lane は raw label 不可、 swim.laneId(label) で取得した slug を渡す"
```

:::

[preview:presets/swim-demo]

このコードは 3 lane を横に並べ、 各 lane に 1 つずつ node を置きます。
`flow` で 2 本の矢印を引き、 `animation` で 2 phase の時間軸 chunk を宣言して step ごとの再生を加えます。

v0.5 Text DSL では `lane` と `actor` を 1 対 1 で扱うので、 `swimlane.laneId(label)` のような slug 取得経路は使えません。
lane 単位で複数 node を stack させたい場合や `contain` 枠を付けたい場合は下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では `lane` と `node` を別宣言できないので、 1 lane に複数 node を stack したい場合や `contain` (枠付き) / `laneWidth` を細かく制御したい場合は以下の chain API で宣言します。

`swimlane` 関数の signature は以下のとおりです。

```ts
swimlane({
  id: string;
  topic: string;
  lanes: string[];           // 上端 label を配列で
  laneWidth?: number;        // 1 lane あたりの幅、 default 400
  contain?: boolean;         // 全 lane を contain (枠付き) にする
}): SwimlaneResult
```

戻り値 `SwimlaneResult` は `DiagramBuilder` (low-level API) を継承しつつ、 `laneId(indexOrLabel)` という getter を追加で持ちます。
`laneId` は lane label から内部 lane id (slug) を取得するためのメソッドです。

完全な利用例は以下のとおりです。

```ts
import { swimlane } from "@cardenelabs/cdl";

const swim = swimlane({
  id: "transfer",
  topic: "ERC20 Transfer",
  lanes: ["Sender", "Contract", "Receiver"],
});

// lane id を取得 (label が slug 化されるため、 日本語 lane label でも OK)
const lSender   = swim.laneId("Sender");
const lContract = swim.laneId("Contract");
const lReceiver = swim.laneId("Receiver");

const transfer = swim
  .node("alice", { lane: lSender,   stack: 0, kind: "actor",    title: "Alice" })
  .node("fn",    { lane: lContract, stack: 0, kind: "function", title: "transfer()" })
  .node("bob",   { lane: lReceiver, stack: 0, kind: "actor",    title: "Bob" })
  .edges([
    { from: "alice", to: "fn",  label: "call" },
    { from: "fn",    to: "bob", label: "emit", tone: "success", style: "dotted-flow" },
  ])
  .phase("call", { duration: 1500, title: "call", body: "Alice が transfer を呼ぶ。" },
    (p) => p.activate("alice", "fn", "alice-fn"))
  .phase("emit", { duration: 1500, title: "emit", body: "Bob へ通知。" },
    (p) => p.activate("fn", "bob", "fn-bob"))
  .build();
```

## `laneId` の使い方

`lanes` に渡した文字列は engine が内部で `slugify` (例 `"送信元"` → `"sosin-yuan"`、 ASCII 英数字と日本語のひらカタ漢字を保持する変換) して lane id に変換します。
著者は `swim.laneId("送信元")` で内部 id を取得すれば、 slug の中身を意識せず lane を参照できます。

::: tabs

@@@ humans 👤 For humans (JA)

```text
title: "日本語 lane 例"
type: swimlane

actors:
  - "送信元"
  - "出力"

flow:
  - "送信元" -> "出力": "transfer"
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: ja, topic: "日本語 lane 例" }
lanes: ["送信元", "出力"]
laneId_lookup:
  - { label: "送信元", returns: slug }
nodes:
  - { id: a, lane: "<slug from laneId('送信元')>", ... }
intent: 日本語 lane label を slug 化、 laneId() で内部 id を取得して node.lane に渡す
```

:::

[preview:presets/swim-demo]

v0.5 Text DSL は actor 名に quote 付き日本語をそのまま使えます。
chain API で同じ表現が必要な場合は `swim.laneId(label)` 経路を使ってください。

```ts
const swim = swimlane({ id: "ja", topic: "日本語 lane 例", lanes: ["送信元", "出力"] });
const lSrc = swim.laneId("送信元");
swim.node("a", { lane: lSrc, ... });
```

## `laneWidth` で lane 幅を揃える

`laneWidth` を渡すと全 lane の幅が同じ px で固定されます。
個別 lane の幅を変えたい場合は低位 API の [lane primitive](/docs/cdl/primitives/lane) を直接使ってください。

::: tabs

@@@ humans 👤 For humans (JA)

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
intent: 全 lane 幅を 520 px 固定、 個別差異は低位 lane primitive 使用
```

:::

v0.5 Text DSL では `laneWidth` を指定できないため、 lane 幅を制御したい場合は chain API を使ってください。

```ts
swimlane({ lanes: ["A", "B", "C"], laneWidth: 520 })
```

各 lane の `x` 座標は engine が lane gap (lane 間の余白) と label clearance (label が次 lane に被らない余裕) を考慮して自動計算します。

## `contain` で全 lane を枠で囲む

`contain: true` を渡すと全 lane が枠付きで描画され、 system 境界を表現できます。

::: tabs

@@@ humans 👤 For humans (JA)

```text
title: "contain example"
type: swimlane

actors:
  - "前段"
  - "中段"
  - "後段"

flow:
  - "前段" -> "中段": "step 1"
  - "中段" -> "後段": "step 2"
```

@@@ llm 🤖 For LLM

```yaml
swimlane:
  lanes: ["前段", "中段", "後段"]
  contain: true
intent: lane 群全体を 1 つの container 枠で囲む (system 境界の表現)
```

:::

v0.5 Text DSL では `contain` を指定できないため、 lane 群全体の枠付き表示が必要な場合は chain API を使ってください。

```ts
swimlane({ lanes: ["前段", "中段", "後段"], contain: true })
```

枠は lane 単位でなく lane 群全体を 1 つの container として描きます。
特定の lane だけ枠付きにしたい場合は低位 API を使ってください。

## 関連

- [flow preset](/docs/cdl/presets/flow) は単一 lane で縦に積み上げる場合の選択肢です。
- [sequence preset](/docs/cdl/presets/sequence) は時系列メッセージ往復が主役の場合の選択肢です。
- [lane primitive](/docs/cdl/primitives/lane) は lane を 1 つずつ宣言する低位 API です。
- [API Reference](/docs/cdl/reference/api#swimlane) は型定義の正式な SSOT です。
