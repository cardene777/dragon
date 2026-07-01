# stateMachine preset

`stateMachine` preset は FSM (Finite State Machine、 有限状態機械、 状態と状態遷移で workflow を表現するモデル) を `state` (状態) と `transition` (遷移) で組み立てる高位 API です。
mermaid `stateDiagram-v2` に対応します。

著者は state を宣言して `initial` (開始) と `final` (終端) marker を立て、 transition で `trigger` (遷移の引き金 event) と `guard` (遷移条件) を指定します。
戻り遷移 (`error` → `idle` のように forward の逆向き) は engine が自動で上方の detour bezier (U 字曲線) を引いて描画します。

## いつ使うか

`stateMachine` は状態が主役の workflow に最適です。
4 から 8 state 程度で、 戻り遷移や条件分岐がある場合に読みやすさが最大化します。

- workflow や process の状態遷移を描きたい
- ボタン UI の状態 (`Idle` / `Loading` / `Done` / `Error`) を可視化したい
- 注文や申請の進行状態 (`Pending` / `Approved` / `Rejected` 等) を示したい

戻り遷移が無く直線的な処理流れなら [flow preset](/docs/cdl/presets/flow) の方が宣言が短くなります。

## なぜ専用 preset を分けたか

低位 API で FSM を描くと、 戻り遷移の bezier を手で計算して overlap (forward path との重なり) を避ける宣言が必要になり、 4 state の図でも宣言が複雑化します。
`stateMachine` preset は戻り遷移を自動検出して engine が detour 経路を計算するため、 著者は `transition` の `from` と `to` を書くだけで forward / back の path が分離します。

> mermaid との違い ... mermaid `stateDiagram-v2` は `[*]` で初期状態を表しますが、 cdl は `initial: true` の boolean flag で明示します。 戻り遷移の overlap 回避は mermaid では手動調整、 cdl は engine が auto で detour します。

## Signature

::: tabs

@@@ humans 👤 人間向け

FSM は v0.5 Text DSL で `type: state` を指定し、 `actors` に state を `state` kind で並べ、 `flow` で state 間の transition を書きます。

```text
title: "<FSM 題名>"
type: state

actors:
  - <State 1>: state
  - <State 2>: state
  - <State 3>: state

flow:
  - <State 1> -> <State 2>: "<trigger event>"
  - <State 2> -> <State 3>: "<trigger event>" (<tone>)
  - <State 3> -> <State 1>: "<trigger event>"
```

[preview:presets/fsm-demo]

state の宣言順序が forward path の左から右の並びになり、 `from` の index > `to` の index となる戻り遷移を engine が検出して自動で上方の bezier 曲線で描きます。
v0.5 Text DSL では `initial` / `final` flag と `guard` (sub label の条件式) は表現できないため、 詳細は本ページ末尾の「API Reference (chain API)」 section を参照してください。

@@@ llm 🤖 LLM向け

```yaml
fn: stateMachine(opts)
args:
  - name: opts
    type: object
    required: true
    properties:
      id: { type: string, required: true, constraints: ["1-32 chars, [a-z0-9-_], unique per page"] }
      topic: { type: string, required: true, max: 80 }
      stateWidth: { type: number, optional: true, default: 360, range: [240, 600] }
      defaultTone: { type: Tone, optional: true }
returns: StateMachineBuilder { state, transition, build }
typical_use:
  - "FSM with 4-8 states, return transitions, or conditional branches"
  - "button UI state visualization (Idle / Loading / Done / Error)"
  - "order or request progress (Pending / Approved / Rejected)"
constraints:
  - "state declaration order = left-to-right forward path order"
  - "return transitions (from-index > to-index) auto-detour as upper U-shaped bezier - do not draw bezier manually"
  - "trigger is required on every transition (event name)"
  - "guard is optional sub label, rendered in monospace below trigger"
  - "for straight-line flow without return transitions, prefer flow preset"
common_hallucinations:
  - '.state({ id, title, type: "initial" }) — use initial: true boolean, not type string'
  - '.transition({ from, to, label: "submit" }) — field is trigger, not label'
  - '.state({ id, title, start: true }) — field is initial, not start'
  - 'stateMachine({ states: [...], transitions: [...] }) — declare via .state() / .transition() chain'
  - '.transition({ from, to, trigger, condition: "x < 3" }) — field is guard, not condition'
```

:::

## 引数

`stateMachine` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier、 同一 page 内で一意 |
| `topic` | `string` | 必須 | 図上部に描画される題名 |
| `stateWidth` | `number` | 任意 | 1 state の幅 px、 default `360` |
| `defaultTone` | `Tone` | 任意 | 全 transition の既定色調 |

`state` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | state identifier、 同一図内で一意 |
| `title` | `string` | 必須 | state 内に表示される主 label |
| `initial` | `boolean` | 任意 | `true` で開始 state、 eyebrow に `"初期"` が出る |
| `final` | `boolean` | 任意 | `true` で終端 state、 eyebrow に `"最終"` が出る |

`transition` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `from` | `string` | 必須 | 起点 state id |
| `to` | `string` | 必須 | 終点 state id |
| `trigger` | `string` | 必須 | edge の主 label (1 行目)、 event 名 |
| `guard` | `string` | 任意 | edge の sub label (2 行目)、 条件式 |
| `tone` | `Tone` | 任意 | この transition だけ色調を上書き |

## 基本例

4 state (`Idle` / `Loading` / `Done` / `Error`) の auth FSM を組む完全例です。

::: tabs

@@@ humans 👤 人間向け (JA)

```text
title: "Auth FSM"
type: state

actors:
  - Idle: state
  - Loading: state
  - Done: state
  - Error: state

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)
  - Error -> Idle: "retry"
```

@@@ llm 🤖 LLM向け

```yaml
diagram: { id: fsm, topic: "Auth FSM" }
states:
  - { id: idle,    label: Idle,    initial: true }
  - { id: loading, label: Loading }
  - { id: done,    label: Done,    final: true }
  - { id: error,   label: Error }
transitions:
  - { from: idle,    to: loading, trigger: submit }
  - { from: loading, to: done,    trigger: success, tone: success }
  - { from: loading, to: error,   trigger: fail,    tone: error }
  - { from: error,   to: idle,    trigger: retry,   guard: "if attempts < 3" }
intent: forward path idle->loading->done/error + 戻り遷移 error->idle で engine が auto detour bezier 描画
```

:::

[preview:presets/fsm-demo]

このコードは 4 state を横並びに配置し、 forward path (`Idle` → `Loading` → `Done` または `Error`) を直線で描き、 戻り遷移 (`Error` → `Idle`) を engine が auto で上方の bezier 曲線で描きます。

v0.5 Text DSL では `initial` / `final` flag と `guard` (遷移条件) を表現できません。
これらを使いたい場合は下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では `initial` / `final` marker と `guard` (sub label) を表現できないため、 詳細な FSM 表現が必要なら以下の chain API で宣言します。

`stateMachine` 関数の signature と builder の interface は以下のとおりです。

```ts
stateMachine({
  id: string;
  topic: string;
  stateWidth?: number;        // 1 state の幅、 default 360
  defaultTone?: Tone;
}): StateMachineBuilder

interface StateMachineBuilder {
  state(s: FsmState): StateMachineBuilder;
  transition(t: FsmTransition): StateMachineBuilder;
  build(): CdlDiagram;
}

interface FsmState {
  id: string;
  title: string;
  initial?: boolean;          // 開始 state
  final?: boolean;            // 終端 state
}

interface FsmTransition {
  from: string;
  to: string;
  trigger: string;            // edge label (主)
  guard?: string;             // edge sub label (条件)
  tone?: Tone;
}
```

完全な利用例は以下のとおりです。

```ts
import { stateMachine } from "@cardenelabs/cdl";

export const fsm = stateMachine({ id: "fsm", topic: "Auth FSM" })
  .state({ id: "idle",    title: "Idle",    initial: true })
  .state({ id: "loading", title: "Loading" })
  .state({ id: "done",    title: "Done",    final: true })
  .state({ id: "error",   title: "Error" })
  .transition({ from: "idle",    to: "loading", trigger: "submit" })
  .transition({ from: "loading", to: "done",    trigger: "success", tone: "success" })
  .transition({ from: "loading", to: "error",   trigger: "fail",    tone: "error" })
  .transition({ from: "error",   to: "idle",    trigger: "retry",   guard: "if attempts < 3" })
  .build();
```

## 戻り遷移の auto detour

`from` の state index が `to` の state index より大きい transition (= 戻り遷移、 例 `error` → `idle`) を engine が検出すると、 自動で上方に detour する bezier (U 字曲線) を描画します。
これにより forward path (`idle` → `loading` → `done` → `error`) と戻り path が完全に分離します。

内部では `routing: "back-detour"` という属性が auto 設定された結果です。
cdl 著者は何も書かなくても overlap (forward と back の重なり) を回避できます。

## `guard` (遷移条件)

`guard` を渡すと edge の sub label (2 行目) に表示されます。
条件式は文字列で渡し、 monospace font で render されます。

::: tabs

@@@ humans 👤 人間向け (JA)

```text
title: "guard example"
type: state

actors:
  - Error: state
  - Idle: state

flow:
  - Error -> Idle: "retry"
```

@@@ llm 🤖 LLM向け

```yaml
transitions:
  - { from: error, to: idle, trigger: retry, guard: "if attempts < 3" }
intent: guard を渡すと sub label に monospace で条件式を render
```

:::

[preview:presets/fsm-demo]

v0.5 Text DSL では `guard` (sub label の条件式) を表現できないため、 `retry` という主 label のみが描画されます。
sub label に条件式を出したい場合は下記 chain API を使ってください。

```ts
.transition({ from: "error", to: "idle", trigger: "retry", guard: "if attempts < 3" })
```

条件式の言語は問わず、 図の読者が理解できる擬似コードや日本語で書けます。

## `initial` / `final` marker

`initial` と `final` flag は state の eyebrow に special 文字列を auto 付与します。
mermaid の `[*] --> Idle` と `Done --> [*]` に相当します。

| marker | eyebrow | 意味 |
|---|---|---|
| `initial: true` | `"初期"` | 開始 state、 図の入口 |
| `final: true` | `"最終"` | 終端 state、 図の出口 |
| (なし) | `"状態"` | 通常 state |

1 つの図に複数の `initial` や `final` を立てることもできます。
複数 initial は「複数の入口がある FSM」、 複数 final は「複数の終了条件がある FSM」 を表現します。

## 関連

- [API Reference](/docs/cdl/reference/api#statemachine) は型定義の正式な SSOT です。
- [Mermaid Migration Guide](/docs/cdl/overview/mermaid-migration) は mermaid → cdl の変換手順をまとめた移行ガイドです。
- [flow preset](/docs/cdl/presets/flow) は状態でなく処理流れが主役の場合の選択肢です。
