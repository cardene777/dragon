# edge

`edge` は node 間の関連を矢印で表す primitive です。
`tone` (色) と `style` (実線 / 点線) と `label` の組合せで、 呼び出し / データアクセス / 成功 / 失敗 など意味を表現します。
phase で `activate` 対象に edge id を渡すと、 該当 step で edge が強調されます。

## API signature

::: tabs

@@@ humans 👤 For humans

```ts
.edge(from: string, to: string, opts: {
  id?: string;                // 省略時 `${from}-${to}` auto 生成 (重複時連番)
  label: string;
  sub?: string;
  tone?: Tone;                // default "accent"
  side?: Side;                // top / bottom / left / right
  style?: EdgeStyle;          // solid (default) / dotted-flow
  labelOffsetX?: number;
  labelOffsetY?: number;
  routing?: "default" | "back-detour";
})
```

@@@ llm 🤖 For LLM

```yaml
fn: .edge
args:
  - name: from
    type: string
    required: true
    constraints:
      - "must reference an existing node id"
  - name: to
    type: string
    required: true
    constraints:
      - "must reference an existing node id, can equal from for self-loop"
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, optional: true, default: "${from}-${to}", hint: "auto numbering on duplicate" }
      label: { type: string, required: true, max: 32 }
      sub: { type: string, optional: true, max: 48, hint: "monospace 2nd line" }
      tone: { type: enum, optional: true, values: [accent, teal, success, warning, error, info], default: accent }
      side: { type: enum, optional: true, values: [top, bottom, left, right], hint: "auto-inferred when omitted" }
      style: { type: enum, optional: true, values: [solid, dotted-flow], default: solid }
      labelOffsetX: { type: number, optional: true, range: [-200, 200] }
      labelOffsetY: { type: number, optional: true, range: [-200, 200] }
      routing: { type: enum, optional: true, values: [default, back-detour], default: default }
returns: DiagramBuilder
typical_use:
  - "directional relation between two nodes (call / data flow / event emit)"
  - "tone-based semantic coloring (success / error / data access)"
  - "back transition with detour routing for state machines"
constraints:
  - "from / to must reference declared node ids"
  - "phase.activate referencing edge id requires the auto-generated or explicit id"
  - "label is mandatory even with tone / style override"
  - "routing: 'back-detour' is intended for reverse-direction edges only"
common_hallucinations:
  - '.edge({ from: ..., to: ..., label: ... }) — from / to are positional, opts is 3rd arg'
  - '.edge("a", "b", "call") — opts must be object with label key'
  - 'tone: "red" / "green" — tone is semantic enum, not color name'
  - 'style: "dashed" / "dotted" — only "solid" / "dotted-flow"'
  - 'arrow: "double" / "open" — no arrowhead option, derived from tone / style'
```

:::

[preview:styles/style-dotted-flow]

## 引数

| 引数 | 型 | 必須 | 用途 |
|---|---|---|---|
| `from` | `string` | 必須 | 起点 node の ID |
| `to` | `string` | 必須 | 終点 node の ID |
| `id` | `string` | 任意 | edge を識別する ID。 省略時は `${from}-${to}` を自動生成します |
| `label` | `string` | 必須 | 矢印の主見出し (1 行目) |
| `sub` | `string` | 任意 | 矢印の副ラベル (2 行目、 monospace 表示) |
| `tone` | `Tone` | 任意 | 色 (6 種、 default `accent`) |
| `side` | `Side` | 任意 | node のどの側面に接続するか (`top` / `bottom` / `left` / `right`) |
| `style` | `EdgeStyle` | 任意 | 線種 (`solid` / `dotted-flow`、 default `solid`) |
| `labelOffsetX` | `number` | 任意 | label の x 方向微調整 (px) |
| `labelOffsetY` | `number` | 任意 | label の y 方向微調整 (px) |
| `routing` | `"default" \| "back-detour"` | 任意 | 経路選択。 `back-detour` で上方に弧を描きます |

## 戻り値

DiagramBuilder を返します。
chain で続けて `.edge()` や `.phase()` を呼び出せます。

## 設計意図

> 💡 なぜ tone と style を分離したか
> edge の意味は「何のための矢印か (色)」 と「同期か非同期か (線種)」 の 2 軸に分解できます。
> `tone` で意味 (成功 / 失敗 / データアクセス) を、 `style` で時間特性 (即時 / 流れ) を独立に指定することで、 6 tone × 2 style = 12 通りの組合せで全関連を表現できます。
> 個別 API (`.successEdge()` / `.dataEdge()`) に分けず、 1 つの API で組合せ自由にした設計です。

## 基本

最小コードは `from` / `to` / `label` の 3 つを指定する形です。
`id` と `tone` と `style` はそれぞれ自動値を持つため、 省略できます。

::: tabs

@@@ humans 👤 For humans

```text
title: "minimal call"
type: sequence

actors:
  - Alice
  - greet: function

flow:
  - Alice -> greet: "call"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: alice, to: greet, label: call }
    # id auto: alice-greet、 tone default: accent、 style default: solid
intent: 最小 3 field (from / to / label)、 残り全部 default で省略可
```

:::

この例では `Alice` から `greet` に accent (橙) 色の実線矢印が引かれ、 中央に `call` ラベルが表示されます。

## batch 宣言

v0.5 Text DSL では `flow:` 配下に並べるだけで batch 宣言になります。
chain API では `.edges()` で配列の各 entry が `.edge()` と同じ option を取ります。

::: tabs

@@@ humans 👤 For humans

```text
title: "round-trip"
type: sequence

actors:
  - a
  - b
  - c

flow:
  - a -> b: "call"
  - b -> c: "ack" (success)
  - c -> a: "done" (info)
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: call }
  - { from: b, to: c, label: ack,  tone: success }
  - { from: c, to: a, label: done, tone: info }
intent: batch 宣言、 chain 見通し向上 (個別 .edge() 連鎖回避)
```

:::

[preview:styles/style-dotted-flow]

## Tone 6 種

`tone` は次の 6 種から選びます。
意味ごとに色を統一すると、 diagram 全体で「成功は緑、 失敗は赤」 という視覚的な約束ができます。

| Tone | hex | 意味 |
|---|---|---|
| `accent` (default) | `#c17f3e` | 中心動作 |
| `teal` | `#4a8b7f` | データアクセス |
| `success` | `#6b9e5a` | 成功 / commit |
| `warning` | `#c9a23e` | 警告 / pending |
| `error` | `#c15a4a` | 失敗 / revert |
| `info` | `#5a8ec1` | 情報 / 補足 |

::: tabs

@@@ humans 👤 For humans

```text
title: "tone palette"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "save"
  - a -> b: "fail" (error)
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: save, tone: teal }   # データアクセス系
  - { from: a, to: b, label: fail, tone: error }  # 失敗
tones:
  - { value: accent,  hex: "#c17f3e", meaning: 中心動作 }
  - { value: teal,    hex: "#4a8b7f", meaning: データアクセス }
  - { value: success, hex: "#6b9e5a", meaning: "成功 / commit" }
  - { value: warning, hex: "#c9a23e", meaning: "警告 / pending" }
  - { value: error,   hex: "#c15a4a", meaning: "失敗 / revert" }
  - { value: info,    hex: "#5a8ec1", meaning: "情報 / 補足" }
intent: tone は意味の semantic enum (色名直書き禁止)
```

:::

各 tone の見本は [`/catalog/styles`](/catalog/styles) で確認できます。

## EdgeStyle 2 種

`style` は次の 2 種から選びます。
動的な動きを表現したい場合は `dotted-flow` を使います。

| Style | 説明 | 用途 |
|---|---|---|
| `solid` (default) | 実線 + 矢頭 | 直接的な呼び出し |
| `dotted-flow` | 点線 + active phase で粒子 (3 重 glow) が流れる | data flow / 非同期 / 経由 |

::: tabs

@@@ humans 👤 For humans

```text
title: "sync vs async"
type: sequence

actors:
  - a
  - b
  - c

flow:
  - a -> b: "call"
  - b -> c: "emit"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: call, style: solid }         # 呼出 (同期)
  - { from: b, to: c, label: emit, style: dotted-flow }   # event 通知 (非同期)
styles:
  - { value: solid,        usage: "直接的な呼び出し", appearance: "実線 + 矢頭" }
  - { value: dotted-flow,  usage: "data flow / 非同期 / 経由", appearance: "点線 + active phase で粒子 (3 重 glow) 流動" }
intent: style は時間特性 (同期 / 非同期) を表現、 tone (意味) と直交軸
```

:::

## label / sub 表示

矢印の中央に表示する文字は `label` (主) と `sub` (副) の 2 段構成です。
SQL クエリのように主動作と詳細を分けたいときに `sub` を使います。

::: tabs

@@@ humans 👤 For humans

```text
title: "SQL query"
type: sequence

actors:
  - api: function
  - db: database

flow:
  - api -> db: "SELECT"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - from: api
    to: db
    label: SELECT            # 主ラベル (1 行目、 17 px bold)
    sub: "WHERE id = $1"     # 副ラベル (2 行目、 15 px monospace)
intent: 主動作 + 詳細を 2 段表示 (SQL クエリ / RPC method 引数 等)
```

:::

v0.5 Text DSL では sub label (副 label) は表現できません。 詳細表示は chain API で `sub` field を指定します。

## label 位置の微調整

複数 edge が混雑する箇所では、 label 同士が重なる場合があります。
`labelOffsetX` / `labelOffsetY` で px 単位の調整ができます (正の値で右 / 下方向)。

::: tabs

@@@ humans 👤 For humans

```text
title: "label offset"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "x"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: x, labelOffsetX: 80, labelOffsetY: -40 }
intent: label 重なり回避の手動微調整 (正値 = 右 / 下、 負値 = 左 / 上、 range -200..+200)
```

:::

v0.5 Text DSL では `labelOffsetX` / `labelOffsetY` を直接表現できません。 微調整が必要な場合は chain API を使います。

## routing (上方 detour)

state machine の back transition のように、 逆向き edge が forward path と重なる場合があります。
`routing: "back-detour"` を指定すると、 上方に大きく弧を描く path に切り替わります。

::: tabs

@@@ humans 👤 For humans

```text
title: "retry loop"
type: state

actors:
  - idle
  - error

flow:
  - idle -> error: "fail"
  - error -> idle: "retry"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: error, to: idle, label: retry, routing: back-detour }
intent: 逆方向 edge が forward path と衝突する場合の上方弧 detour
note: stateMachine preset の back transition では自動指定、 手動構築時のみ明示
```

:::

v0.5 Text DSL の `type: state` 経路は back transition を自動検出して上方 detour を指定します。
preset を介さず手動で構築する場合のみ chain API で `routing: "back-detour"` を明示します。

## side (接続側)

`top` / `bottom` / `left` / `right` で、 node のどの側面に edge を接続するか指定します。
省略時は from / to の位置関係から自動推定します。

::: tabs

@@@ humans 👤 For humans

```text
title: "top connect"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "x"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: x, side: top }    # a 上端 -> b 上端
intent: 接続側面の明示指定、 default は from / to の位置関係から自動推定
```

:::

v0.5 Text DSL では `side` を直接表現できないため、 default の自動推定で十分でない場合は chain API を使います。

## edge auto id の動作

`id` を省略すると `${from}-${to}` で自動生成し、 同じ from-to の組合せが複数ある場合は連番を付けます。
`phase.activate` で edge を指す場合は、 生成された ID を渡してください。

::: tabs

@@@ humans 👤 For humans

```text
title: "duplicate edges"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "step 1"
  - a -> b: "step 2"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: a, to: b, label: "step 1" }   # auto id: a-b
  - { from: a, to: b, label: "step 2" }   # auto id: a-b-2 (連番)
intent: id 省略時 ${from}-${to} 形式で自動生成、 重複時は -2 / -3 連番付与
```

:::

phase で active 化するときは生成済み id を使います。

::: tabs

@@@ humans 👤 For humans

```text
title: "phase activate edge"
type: sequence

actors:
  - a
  - b

flow:
  - a -> b: "call"

animation:
  - step: "call" 1.2s
    focus: [a, b]
```

@@@ llm 🤖 For LLM

```yaml
phases:
  - id: p
    activates: [a, b, a-b]   # node a + node b + edge a-b の auto id を指定
intent: phase.activate は node / edge / phase の id を可変長で受ける (edge は auto id 指定)
```

:::

v0.5 Text DSL の `focus` field は node id を列挙し、 edge は自動で active 化されます (`focus` 間の edge が phase 中強調)。

## API Reference (chain API)

v0.5 Text DSL で表現できない `tone` 細粒度指定 (一部) / `sub` / `labelOffsetX` / `labelOffsetY` / `side` / `routing` 等を扱う場合は builder API を使います。

```ts
.edge("alice", "greet", { label: "call" })
// id auto: "alice-greet"、 tone default: "accent"、 style default: "solid"

.edges([
  { from: "a", to: "b", label: "call" },
  { from: "b", to: "c", label: "ack",  tone: "success" },
  { from: "c", to: "a", label: "done", tone: "info" },
])

.edge("a", "b", { label: "save", tone: "teal" })       // データアクセス系
.edge("a", "b", { label: "fail", tone: "error" })      // 失敗

.edge("a", "b", { label: "call", style: "solid" })          // 呼出
.edge("b", "c", { label: "emit", style: "dotted-flow" })    // event 通知

.edge("api", "db", {
  label: "SELECT",            // 主ラベル (1 行目、 17px bold)
  sub: "WHERE id = $1",       // 副ラベル (2 行目、 15px monospace)
})

.edge("a", "b", { label: "x", labelOffsetX: 80,  labelOffsetY: -40 })

.edge("error", "idle", { label: "retry", routing: "back-detour" })

.edge("a", "b", { label: "x", side: "top" })   // a の上端 → b の上端 (top-top routing)

.edges([
  { from: "a", to: "b", label: "step 1" },  // id: "a-b"
  { from: "a", to: "b", label: "step 2" },  // id: "a-b-2"
])

.activate("a", "b", "a-b")
```

## 関連

- [node](/docs/cdl/primitives/node) ... edge の from / to に指定します
- [phase](/docs/cdl/primitives/phase) ... edge を active 化する step を宣言します
- [API Reference](/docs/cdl/reference/api#edge) ... 全 field の型定義です
