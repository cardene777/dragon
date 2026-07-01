# flow preset

`flow` preset は 1 本の lane (列) に縦方向の `step` (処理単位) を順に積み上げて、 前 step から次 step へ自動で edge (矢印) を引く高位 API です。
mermaid `flowchart TB` (top-to-bottom flowchart) の縦方向の流れに相当します。

著者は step を chain で並べるだけで、 engine が `stack` (積み順) と前後の edge を自動接続します。
1 actor 1 system 内の直線的な処理を最短宣言で描けるよう設計しています。

## いつ使うか

`flow` は単一の lane を縦に貫く 1 本道の workflow に最適です。
分岐や並列 actor が無いなら、 この preset で宣言量が最小化します。

- 縦方向の sequential workflow を描きたい
- 1 actor または 1 system 内の処理流れを示したい
- auth flow / 申請 flow / pipeline 等の直線的な step を並べたい

## いつ使わないか

並列や分岐がある場合は別の preset が向きます。
無理に `flow` で表現すると lane が増えて宣言が複雑になります。

- 並列に actor が動く場合は [swimlane preset](/docs/cdl/presets/swimlane) を使ってください
- UML sequence diagram (時系列メッセージ往復) は [sequence preset](/docs/cdl/presets/sequence) を使ってください
- 分岐 (条件遷移) を含む場合は [stateMachine preset](/docs/cdl/presets/state-machine) を使ってください

## なぜ専用 preset を分けたか

低位 API でも単一 lane の縦並びは作れますが、 step ごとに `node` と `edge` を別々に宣言する必要があり、 5 step の宣言で 10 行を超えます。
`flow` preset は「step を宣言すると自動で前 step との edge が生成される」 という機構で、 同じ図を半分以下の行数で書けるよう圧縮しています。

> mermaid との違い ... mermaid `flowchart TB` は `A --> B` の宣言ごとに矢印を 1 つずつ書きますが、 cdl `flow` は `.step(...)` を chain するだけで前 step からの矢印が自動接続されます。

## Signature

::: tabs

@@@ humans 👤 人間向け

`flow` 図は v0.5 Text DSL で `type: flow` を指定し、 `actors` に縦並びの node を並べ、 `flow` で step 間 label を書きます。

```text
title: "<diagram 題名>"
type: flow

actors:
  - <Node 1>: <kind>
  - <Node 2>: <kind>
  - <Node 3>: <kind>

flow:
  - <Node 1> -> <Node 2>: "<step 間 label>"
  - <Node 2> -> <Node 3>: "<step 間 label>"
```

[preview:presets/flow-demo]

`actors` の宣言順序が縦並びの上から下の順となり、 `flow` で書いた矢印 label が前 step から次 step への遷移 label として描画されます。
chain API の `transitionLabel` (第 2 引数) と `eyebrow` (副 label) と `laneLabel` (lane 見出し) は v0.5 Text DSL では表現できないため、 詳細は本ページ末尾の「API Reference (chain API)」 section を参照してください。

@@@ llm 🤖 LLM向け

```yaml
fn: flow(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      laneLabel: { type: string, required: true, max: 24, hint: "heading shown at the top of the single lane" }
      laneWidth: { type: number, optional: true, hint: "width of the single lane in px" }
      defaultTone: { type: Tone, optional: true }
      defaultStyle: { type: EdgeStyle, optional: true }
returns: FlowBuilder { step, build }
typical_use:
  - "vertical sequential workflow inside one actor or system"
  - "auth flow / approval flow / pipeline declared as a straight line"
  - "single-lane workflow without branching or parallelism"
constraints:
  - "step takes (input, transitionLabel?), transitionLabel is 2nd positional arg, not a property"
  - "transitionLabel on the first step is ignored (no previous step to connect from)"
  - "edge between steps is auto-generated, do not declare it manually with .edge"
  - "for branching or return transitions, switch to stateMachine preset"
common_hallucinations:
  - '.step({ id, kind, title, transitionLabel: "..." }) — transitionLabel is 2nd arg, not a property of input'
  - 'flow(id, topic, laneLabel) — opts must be a single object'
  - '.step({ id, title }) — kind is required, do not omit'
  - '.edge({ from, to, label }) — do not declare edges manually, use transitionLabel instead'
  - '.branch({ ... }) — no branch API, use stateMachine preset for branches'
```

:::

## 引数

`flow` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier、 同一 page 内で一意 |
| `topic` | `string` | 必須 | 図上部に描画される題名 |
| `laneLabel` | `string` | 必須 | 単一 lane の上端 heading に出る文字 |
| `defaultTone` | `Tone` | 任意 | 全 step の既定色調 |

`step` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | node の identifier、 同一図内で一意 |
| `kind` | `NodeKind` | 必須 | 描画 kind (`person` / `api` / `service` / `database` 等) |
| `title` | `string` | 必須 | node 内に表示される主 label |
| `eyebrow` | `string` | 任意 | title の上に小さく出る副 label |
| `transitionLabel` | `string` | 任意 | 前 step からの矢印 label (`step` の第 2 引数) |

## 基本例

`flow` で 4 step の auth flow を組む完全例です。

::: tabs

@@@ humans 👤 人間向け (JA)

```text
title: "Auth Flow"
type: flow

actors:
  - User: person
  - "POST /login": api
  - AuthService: service
  - "users 表": database

flow:
  - User -> "POST /login": "ログイン要求"
  - "POST /login" -> AuthService: "認証処理"
  - AuthService -> "users 表": "credential 検証"
```

@@@ llm 🤖 LLM向け

```yaml
diagram: { id: auth, topic: Auth Flow, laneLabel: Authentication }
steps:
  - { id: user, kind: person,   title: User,          eyebrow: ユーザー }
  - { id: api,  kind: api,      title: "POST /login", eyebrow: API,     transition: ログイン要求 }
  - { id: auth, kind: service,  title: AuthService,   eyebrow: サービス, transition: 認証処理 }
  - { id: db,   kind: database, title: "users 表",    eyebrow: DB,      transition: "credential 検証" }
intent: 単一 lane を縦に貫く 4 step、 step 間 edge は transition label で自動接続
```

:::

[preview:presets/flow-demo]

このコードは 1 本の lane を中央に置き、 4 つの node を上から `User` / `POST /login` / `AuthService` / `users 表` の順に縦に積みます。
flow の各 step 間 edge label (`"ログイン要求"` / `"認証処理"` / `"credential 検証"`) が、 前 node からの矢印 label として描画されます。

v0.5 Text DSL では `eyebrow` (副 label) と `laneLabel` (lane 上端の見出し) は宣言できません。
これらを使いたい場合は下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では `eyebrow` / `laneLabel` / `transitionLabel` の第 2 引数経路が表現できないため、 詳細な制御が必要なら以下の chain API で宣言します。

`flow` 関数の signature と builder の interface は以下のとおりです。

```ts
flow({
  id: string;
  topic: string;
  laneLabel: string;
  defaultTone?: Tone;
}): FlowBuilder

interface FlowBuilder {
  step(input: FlowStepInput, transitionLabel?: string): FlowBuilder;
  build(): CdlDiagram;
}

interface FlowStepInput {
  id: string;
  kind: NodeKind;
  title: string;
  eyebrow?: string;
}
```

完全な利用例は以下のとおりです。

```ts
import { flow } from "@cardenelabs/cdl";

const auth = flow({ id: "auth", topic: "Auth Flow", laneLabel: "Authentication" })
  .step({ id: "user", kind: "person",   title: "User",        eyebrow: "ユーザー" })
  .step({ id: "api",  kind: "api",      title: "POST /login", eyebrow: "API" }, "ログイン要求")
  .step({ id: "auth", kind: "service",  title: "AuthService", eyebrow: "サービス" }, "認証処理")
  .step({ id: "db",   kind: "database", title: "users 表",    eyebrow: "DB" }, "credential 検証")
  .build();
```

## 関連

- [API Reference](/docs/cdl/reference/api#flow) は型定義の正式な SSOT です。
- [swimlane preset](/docs/cdl/presets/swimlane) は並列 lane を扱う場合の選択肢です。
- [stateMachine preset](/docs/cdl/presets/state-machine) は分岐や戻り遷移を含む場合の選択肢です。
