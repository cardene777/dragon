# lane

`lane` は diagram の横方向の区画 (列) を表す primitive です。
actor 群、 system 境界、 category などを 1 つの列にまとめる単位として使います。
列ごとに `x` 位置と `width` を指定し、 列の中に `node` を縦に並べる構造です。

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.lane(id: string, opts: {
  x: number;              // viewport x 位置 (px)
  width: number;          // 幅 (px)
  label?: string;         // 列見出し
  contain?: boolean;      // true で枠囲み (boundary 描画)
  lifeline?: boolean;     // true で lane 中央に縦点線 (UML sequence 用)
})
```

@@@ llm 🤖 For LLM

```yaml
fn: .lane
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
  - name: opts
    type: object
    required: true
    properties:
      x: { type: number, range: [0, 2400], hint: "multiples of 20" }
      width: { type: number, range: [200, 800] }
      label: { type: string, optional: true, max: 24 }
      contain: { type: boolean, optional: true, default: false }
      lifeline: { type: boolean, optional: true, default: false }
returns: DiagramBuilder
typical_use:
  - "horizontal partition (column) for grouping nodes"
  - "system boundary or category visualization"
constraints:
  - "contain: true + lifeline: true is mutually exclusive"
  - "contain: true requires at least 1 child node"
common_hallucinations:
  - '.lane({ id: ..., x: ... }) — opts is 2nd arg, not 1st'
  - '.lane("u", 0, 320) — opts must be object'
  - 'opts.lane — not a property'
```

:::

[preview:primitives/lane-contain]

## 引数

| 引数 | 型 | 必須 | 用途 |
|---|---|---|---|
| `id` | `string` | 必須 | lane を識別する一意の ID。 `node` の `lane` field から参照します |
| `x` | `number` | 必須 | viewport 上の x 座標 (px) |
| `width` | `number` | 必須 | 列の幅 (px) |
| `label` | `string` | 任意 | 列の上端に表示する見出し |
| `contain` | `boolean` | 任意 | `true` で列全体を破線枠で囲みます (system 境界の表現) |
| `lifeline` | `boolean` | 任意 | `true` で列中央に縦点線を引きます (UML sequence の lifeline) |

## 戻り値

DiagramBuilder を返します。
chain で `.lane()` や `.node()` を続けて呼び出せます。

## 設計意図

> 💡 なぜ `lane` が primitive として独立しているか
> swimlane や sequence のように複数の actor を並べる diagram では、 actor ごとの「縦のスペース」 を明示的に確保する必要があります。
> `lane` を primitive として分離することで、 actor 列だけでなく「system 境界」 「責務分割」 「外部 / 内部の区切り」 など任意の意味付けに転用できます。
> `x` と `width` を直接指定する API にした理由は、 高位の preset (`swimlane()`) が内部で自動計算する一方、 手動配置の柔軟性も残すためです。

## 基本

最小コードは 2 列を `x` と `width` で並べる形です。
列の間に 80-120 px の gap を空けると、 edge label が読みやすくなります。

::: tabs

@@@ humans 👤 For humans

```text
title: "Example"
type: swimlane

actors:
  - left
  - right
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: ex, topic: Example }
lanes:
  - { id: left,  x: 0,   width: 320 }
  - { id: right, x: 460, width: 320 }
intent: 2 列を x / width 直接指定で配置、 列間 gap = 460 - 320 = 140 px (edge label 読みやすさ閾値)
```

:::

この例では `left` 列と `right` 列が 2 列の swimlane として横に並びます。
v0.5 Text DSL では `x` / `width` は preset が自動計算するため、 actors 宣言だけで 2 列構成が完成します。

## contain (枠囲み)

`contain: true` を渡すと、 列を破線の枠で囲みます。
AWS / GCP などのクラウド境界や、 microservice の責務範囲を表現するときに使います。

::: tabs

@@@ humans 👤 For humans

```text
title: "AWS Boundary"
type: topology

actors:
  - aws: cloud
```

@@@ llm 🤖 For LLM

```yaml
lanes:
  - { id: aws, x: 540, width: 460, label: AWS, contain: true }
intent: 列を破線枠で囲み system 境界 (cloud / microservice 責務範囲) を表現
```

:::

[preview:primitives/lane-contain]

v0.5 Text DSL では `topology` preset または `kind: cloud` を持つ actor 宣言で system 境界が自動描画されます。
chain API で `contain: true` を指定した lane は、 内部 node 全体を含む高さに自動で expand し、 枠の見た目は neumorphism スタイル (破線 border + 微かな fill) で render されます。

## lifeline (UML sequence 用)

`lifeline: true` を渡すと、 lane の中央に縦点線を引きます。
UML sequence diagram の lifeline (actor の生存期間を示す縦線) を表現します。

::: tabs

@@@ humans 👤 For humans

```text
title: "User Lifeline"
type: sequence

actors:
  - User
```

@@@ llm 🤖 For LLM

```yaml
lanes:
  - { id: user, width: 220, label: User, lifeline: true }
intent: UML sequence lifeline (actor 生存期間の縦点線) を lane 中央に描画
note: sequence preset 経由なら自動指定、 手動構築時のみ明示
```

:::

v0.5 Text DSL の `type: sequence` 経路は内部で `lifeline: true` を自動指定するため、 通常はこの flag を意識する必要はありません。
preset を介さず手動で sequence 風 diagram を組む場合のみ chain API で明示します。

## 配置の指針

`x` と `width` を手動で指定する場合、 列数に応じた推奨値は次の通りです。
表の値は viewport 幅 1400 px を前提とし、 列間 gap を 80-120 px 確保した設計です。

| 用途 | x / width 推奨値 |
|---|---|
| 2 lane | `(0, 400)` / `(500, 400)` |
| 3 lane | `(0, 320)` / `(440, 380)` / `(900, 320)` |
| 4 lane | `(0, 280)` / `(380, 280)` / `(760, 280)` / `(1140, 280)` |

## auto-layout 経路

`x` と `width` を手計算したくない場合は、 `swimlane` preset を使います。
`type: swimlane` に actors を並べると、 lane 数から `x` と `width` を自動計算します。

::: tabs

@@@ humans 👤 For humans

```text
title: "3-lane swimlane"
type: swimlane

actors:
  - client
  - api: function
  - db: storage
```

@@@ llm 🤖 For LLM

```yaml
preset: swimlane
lanes: [client, api, db]
intent: 高位 preset で lane 数から x / width を自動計算 (手動配置不要)
note: viewport 1400 px 前提で 3 lane なら (0, 320) / (440, 380) / (900, 320) 相当
```

:::

詳細は [swimlane preset](/docs/cdl/presets/swimlane) を参照してください。

## API Reference (chain API)

builder API を直接呼び出す場合の syntax です。
v0.5 Text DSL で表現しきれない `contain` / `lifeline` 等の細かい option を扱うときに使います。

```ts
diagram("ex", { topic: "Example" })
  .lane("left",  { x: 0,   width: 320 })
  .lane("right", { x: 460, width: 320 })

.lane("aws", { x: 540, width: 460, label: "AWS", contain: true })

.lane("user", { width: 220, label: "User", lifeline: true })

swimlane({ lanes: ["client", "api", "db"] })
  .node(...).edge(...).build()
```

## 関連

- [node](/docs/cdl/primitives/node) ... lane に所属する個別パーツです
- [swimlane preset](/docs/cdl/presets/swimlane) ... lane を 1 行で複数宣言できる高位 API です
- [API Reference](/docs/cdl/reference/api#lane) ... 全 field の型定義です
