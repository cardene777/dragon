# sequence preset

`sequence` preset は UML sequence diagram (actor 列 × 時系列 step、 時間軸を縦方向に取って actor 間のメッセージ往復を描く図) を 1 つの builder で組み立てる高位 API です。
mermaid `sequenceDiagram` に対応し、 actor 配列だけで `lane` (列) と `lifeline` (縦点線) と `header` (上端の card) と `footer` (下端の card) を engine が auto 生成します。

著者は actor 名と step (`from` / `to` / `label`) を宣言するだけで、 lane の `x` / `width` / slug 計算は engine 側に閉じ込められます。

## いつ使うか

`sequence` は actor と actor の時系列的なメッセージ往復に最適です。
3 から 5 個の actor が同期的にやり取りする場面で読みやすさが最大化します。

- UML sequence diagram を描きたい
- API call の往復 (`Client` → `API` → `DB` → `API` → `Client`) を時系列で示したい
- 3 から 5 actor 程度の同期的やり取りを 1 枚に収めたい

並列に actor が動いて時系列が主役でない場合は [swimlane preset](/docs/cdl/presets/swimlane) が向きます。
縦方向の単一 lane に処理が連なるなら [flow preset](/docs/cdl/presets/flow) を選びます。

## なぜ専用 preset を分けたか

低位 API (`primitives` で `lane` を 1 つずつ宣言し、 lifeline 用の縦点線を手で描き、 各 step に activation marker を置く) でも sequence diagram は作れますが、 step を 10 個書くだけで宣言が 50 行を超えます。
`sequence` preset は header / footer / lifeline / activation marker を engine 側で auto 生成して、 著者の宣言を「actor 配列 + step だけ」 に圧縮します。

> mermaid との違い ... mermaid `sequenceDiagram` は静的な PNG を出すだけですが、 cdl の `sequence` は `phase` (時間軸 chunk) と組み合わせると step ごとの animation 表示も可能です。

## Signature

::: tabs

@@@ humans 👤 For humans

`sequence` 図は v0.5 Text DSL で `type: sequence` を指定し、 `actors` に header 名を並べ、 `flow` に矢印を書きます。

```text
title: "<diagram 題名>"
type: sequence

actors:
  - <Actor 1>
  - <Actor 2>
  - <Actor 3>

flow:
  - <Actor 1> -> <Actor 2>: "<label>"
  - <Actor 2> -> <Actor 3>: "<label>" (<tone>, <style>)
```

[preview:presets/seq-demo]

`actors` 配列に渡した名前は header の表示文字列としても、 `flow` 行の `from` / `to` の参照 id としても使えます。
engine が内部で slug 化して lane id に変換するため、 著者は actor 名そのものを矢印の両端に書けます。

末尾の `(<tone>, <style>)` で `success` / `error` / `warning` / `info` / `accent` / `teal` 等の tone と `solid` / `dotted-flow` の line style を指定できます。
chain API の型 signature は本ページ末尾の「API Reference (chain API)」 section を参照してください。

@@@ llm 🤖 For LLM

```yaml
fn: sequence(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      actors: { type: "string[]", required: true, hint: "3-5 actors recommended, order = left-to-right" }
      defaultTone: { type: Tone, optional: true }
      defaultStyle: { type: EdgeStyle, optional: true }
      laneWidth: { type: number, optional: true, default: 340, range: [220, 600] }
returns: SequenceBuilder { step, build }
typical_use:
  - "UML sequence diagram with synchronous message round-trips"
  - "API call timeline (Client -> API -> DB -> API -> Client)"
  - "3-5 actors of synchronous interaction on one page"
constraints:
  - "actors order = left-to-right header ordering, cannot reorder later"
  - "step.from / step.to must reference names exactly as listed in actors"
  - "engine auto-generates lifeline, header, footer, activation markers - do not declare manually"
common_hallucinations:
  - 'sequence(id, topic, actors) — opts must be a single object, not positional args'
  - '.step("User", "API", "label") — step takes object, not positional args'
  - '.step({ actor: ..., message: ... }) — use from / to / label, not actor / message'
  - '.participant("Alice") — no such method, declare in actors array instead'
  - '.note({ over: "Alice" }) — no note API yet, use step.sub instead'
```

:::

## 引数

`sequence` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier、 同一 page 内で一意 |
| `topic` | `string` | 必須 | 図上部に描画される題名 |
| `actors` | `string[]` | 必須 | 上端 header に並ぶ actor 名、 配列の順序 = 左から右の並び |
| `defaultTone` | `Tone` | 任意 | 全 step の既定色調、 step 個別の `tone` で上書き可能 |
| `defaultStyle` | `EdgeStyle` | 任意 | 全 edge の既定 line style、 step 個別の `style` で上書き可能 |
| `laneWidth` | `number` | 任意 | 1 lane あたりの幅 px、 default `340` |

`step` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `from` | `string` | 必須 | 矢印の起点 actor 名 |
| `to` | `string` | 必須 | 矢印の終点 actor 名 |
| `label` | `string` | 必須 | 矢印上の主 label (1 行目) |
| `sub` | `string` | 任意 | 矢印上の補助 label (2 行目)、 mermaid Note 相当 |
| `tone` | `Tone` | 任意 | この step だけ色調を上書き |
| `style` | `EdgeStyle` | 任意 | 矢印 style (`solid` / `dotted-flow` 等) |

## 基本例

3 actor (`User` / `API` / `DB`) で login flow を組む完全例です。

::: tabs

@@@ humans 👤 For humans (JA)

```text
title: "Login Flow"
type: sequence

actors:
  - User
  - API
  - DB

flow:
  - User -> API: "POST /login"
  - API -> DB: "SELECT credentials"
  - DB -> API: "rows" (success, dotted-flow)
  - API -> User: "200 OK" (success)
```

@@@ llm 🤖 For LLM

```yaml
diagram: { id: login, topic: Login Flow }
actors: [User, API, DB]
steps:
  - { from: User, to: API,  label: "POST /login", sub: "email + password" }
  - { from: API,  to: DB,   label: "SELECT credentials" }
  - { from: DB,   to: API,  label: rows,   tone: success, style: dotted-flow }
  - { from: API,  to: User, label: "200 OK", sub: JWT, tone: success }
intent: User -> API -> DB -> API -> User の同期 round-trip を時系列で描く
```

:::

[preview:presets/seq-demo]

このコードを実行すると engine が 3 lane を横に並べ、 各 lane の上下に header と footer を auto 配置します。
4 本の flow 行が時系列に下方向へ並び、 `(success)` を末尾 option に指定した 3 つ目と 4 つ目の矢印が緑系の色で描画されます。

v0.5 Text DSL では `sub` (補助 label、 2 行目) は宣言できません。
補助 label が必要な場合は下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では `step.sub` (補助 label) を表現できないため、 mermaid Note 相当の表現が必要なら以下の chain API で宣言します。

`sequence` 関数の signature と builder の interface は以下のとおりです。

```ts
sequence({
  id: string;
  topic: string;
  actors: string[];           // 上端 header に並ぶ actor 名
  defaultTone?: Tone;
  defaultStyle?: EdgeStyle;
  laneWidth?: number;         // 1 lane あたりの幅、 default 340
}): SequenceBuilder

interface SequenceBuilder {
  step(input: {
    from: string;
    to: string;
    label: string;
    sub?: string;
    tone?: Tone;
    style?: EdgeStyle;
  }): SequenceBuilder;
  build(): CdlDiagram;
}
```

完全な利用例は以下のとおりです。

```ts
import { sequence } from "@cardenelabs/cdl";

export const login = sequence({
  id: "login",
  topic: "Login Flow",
  actors: ["User", "API", "DB"],
})
  .step({ from: "User", to: "API", label: "POST /login", sub: "email + password" })
  .step({ from: "API",  to: "DB",  label: "SELECT credentials" })
  .step({ from: "DB",   to: "API", label: "rows", tone: "success", style: "dotted-flow" })
  .step({ from: "API",  to: "User", label: "200 OK", sub: "JWT", tone: "success" })
  .build();
```

## 内部構造

`sequence` を build すると engine は以下を auto 生成します。
著者がこれらを直接宣言する必要はありません。

- `actors.length` 本の lane (`lifeline = true` で中央に縦点線が走る)
- 各 lane 上端の header (kind = `card`、 width 140 px、 height 72 px)
- 各 lane 下端の footer (header と同じ box)
- 各 step につき 1 つの activation marker (width 2 px、 height 2 px の不可視 node)
- 各 step につき 1 本の edge (`step.from` の lane の activation marker から `step.to` の lane へ)

この auto 生成により、 著者は「actor は誰か」 と「どの順で何を送るか」 だけを宣言します。

## mermaid との対応

mermaid `sequenceDiagram` の主要 syntax を cdl `sequence` に置き換える対応表です。

| mermaid | cdl |
|---|---|
| `sequenceDiagram` | `sequence({ id, topic, actors })` |
| `participant Alice` | `actors: ["Alice", ...]` の配列要素 |
| `Alice->>API: 呼び出し` | `.step({ from: "Alice", to: "API", label: "呼び出し" })` |
| `API-->>Alice: response` | `.step({ from: "API", to: "Alice", label: "response", style: "dotted-flow" })` |
| `Note over Alice` | 現状は `step.sub` で代用 |

mermaid の `Note` 相当の機能は今のところ `step.sub` (補助 label) で代用します。
独立した note box を描く API は今後追加予定です。

## 関連

- [Mermaid Migration Guide](/docs/cdl/overview/mermaid-migration) は mermaid → cdl の変換手順をまとめた移行ガイドです。
- [swimlane preset](/docs/cdl/presets/swimlane) は時系列が主役でない並列 actor の場合に向きます。
- [API Reference](/docs/cdl/reference/api#sequence) は型定義の正式な SSOT です。
