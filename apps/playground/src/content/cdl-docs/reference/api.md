# API Reference (全 API)

`@cardenelabs/cdl` が export する全 public API の仕様を、 1 file にまとめた **Reference** です。
関数 signature / 引数 / 戻り値 / 補足のみを並べ、 使い方の解説は最小限にしています。

> このページは **Reference** です。
> 「動かしてみたい」 場合は [Quickstart](/docs/cdl/overview/quickstart)、
> 「なぜこう設計したか」 は [Overview](/docs/cdl/README) を参照してください。

## TOC

このページは長いので、 まず目次から該当 API に飛んでください。

- [低位 API ... `diagram()` builder](#低位-api--diagram-builder)
  - [`.lane(id, opts)`](#laneid-opts)
  - [`.node(id, opts)` / `.nodes([...])`](#nodeid-opts--nodes)
  - [`.edge(from, to, opts)` / `.edges([...])`](#edgefrom-to-opts--edges)
  - [`.state(id, opts)`](#stateid-opts)
  - [`.phase(id, opts, build)`](#phaseid-opts-build)
  - [`.build()`](#build)
- [高位 API ... 6 preset (mermaid 同等)](#高位-api--6-preset-mermaid-同等)
  - [`sequence(...)`](#sequence)
  - [`er(...)`](#er)
  - [`stateMachine(...)`](#statemachine)
  - [`swimlane(...)`](#swimlane)
  - [`flow(...)`](#flow)
  - [`topology(...)`](#topology)
- [React 表示](#react-表示)
- [validation / verifier API](#validation--verifier-api)
- [NodeKind 一覧 (29 種)](#nodekind-一覧-29-種)
- [Tone 一覧](#tone-一覧)
- [EdgeStyle 一覧](#edgestyle-一覧)
- [関連](#関連)

## 低位 API ... `diagram()` builder

任意の lane / node / edge / phase を組み立てる primitive API です。
mermaid の自由記述に相当し、 細かい layout 制御が必要な場合に使います。

次の signature で `DiagramBuilder` を返します。
`id` は内部参照用、 `topic` は header に表示される文字列です。

```ts
diagram(id: string, options: { topic: string }): DiagramBuilder
```

戻り値の `DiagramBuilder` に `.lane()` / `.node()` / `.edge()` / `.state()` / `.phase()` / `.build()` が生えています。
以下の各 method を chain して diagram を組み立てます。

### `.lane(id, opts)`

縦の列 (lane) を 1 本宣言します。
sequence の actor 列、 swimlane の各レーン、 topology の grouping 等に対応します。

```ts
.lane(id: string, opts: {
  x: number;                  // viewport x 位置 (px)
  width: number;              // 幅 (px)
  label?: string;             // lane heading 表示
  contain?: boolean;          // true で枠囲み (boundary) を描く
  lifeline?: boolean;         // true で lane 中央に縦点線 (sequence 用)
})
```

`contain: true` を指定すると、 lane 全体を箱で囲む boundary が描かれます。
`lifeline: true` は sequence preset の actor 列で自動的にセットされます。

[preview:presets/seq-demo]

### `.node(id, opts)` / `.nodes([...])`

1 個の node、 または node 配列を宣言します。
`node()` を 1 つずつ書くか、 `nodes([...])` で一気に渡すかは好みで選んでください。

```ts
.node(id: string, opts: {
  lane: string;               // 所属 lane id
  stack: number;              // 縦 stack 番号 (0 から)
  kind: NodeKind;             // visual 種別 (actor / function / storage / event / card / ...)
  title: string;
  subtitle?: string;
  eyebrow?: string;
  value?: string;             // actor / storage で value 表示 ({stateId} 補間 OK)
  rows?: string[];            // storage の rows ({stateId} 補間 OK)
  w?: number;                 // 幅 override (default は kind ごと固定)
  h?: number;                 // 高さ override
})

// batch helper
.nodes(defs: Array<{ id: string } & Omit<CdlNode, "id">>)
```

`value` / `rows` の中に `{stateId}` 形式で state id を埋めると、 animation 中の値が文字列に補間されます。
`kind` で選べる種類は [NodeKind 一覧](#nodekind-一覧-29-種) を参照してください。

[preview:presets/seq-demo]

### `.edge(from, to, opts)` / `.edges([...])`

矢印 (edge) を 1 本、 または配列で宣言します。
`from` / `to` には node id を渡します。

```ts
.edge(from: string, to: string, opts: {
  id?: string;                // 省略時は `${from}-${to}` auto 生成 (重複時連番)
  label: string;
  sub?: string;
  tone?: Tone;                // default "accent"
  side?: Side;                // top / bottom / left / right
  style?: EdgeStyle;          // solid (default) / dotted-flow
  labelOffsetX?: number;      // label 微調整
  labelOffsetY?: number;
  routing?: "default" | "back-detour";  // back-detour で path 上方 detour
})

// batch helper
.edges(defs: Array<...>)
```

`id` を省略すると `${from}-${to}` 形式で自動生成されます。
同じ pair が複数回登場する場合は末尾に連番が付きます。

[preview:presets/seq-demo]

### `.state(id, opts)`

animation 中に補間したい数値 / 文字列 state を宣言します。
phase 内の `.tween()` / `.set()` で値を変えていきます。

```ts
.state(id: string, opts: {
  initial: number | string;   // 初期値 (animation 開始時)
})
```

`initial` は animation 開始時の値です。
node の `value` や `rows` の中に `{stateId}` 形式で埋め込むと、 補間値が画面に反映されます。

### `.phase(id, opts, build)`

時系列の 1 段階 (phase) を宣言します。
複数の phase を順に書くと、 自動的に sequential animation になります。

```ts
.phase(id: string, opts: { duration?: number; title: string; body: string },
  build: (p: PhaseBuilder) => PhaseBuilder)

interface PhaseBuilder {
  activate(...ids: string[]): PhaseBuilder;        // active 強調表示
  tween(stateId: string, from: number, to: number): PhaseBuilder;  // 数値線形補間
  set(stateId: string, value: number | string): PhaseBuilder;       // 即時切替
  badge(text: string): PhaseBuilder;               // phase footer badge
}
```

`activate(...ids)` で渡した node / edge は、 その phase の間だけ強調表示されます。
`tween()` は数値の線形補間、 `set()` は即時切替で、 動き方が異なります。

[preview:animation/tween-simple]

### `.build()`

builder chain の最後に呼び、 immutable な `CdlDiagram` を返します。
内部で `validate()` が走り、 失敗時は例外を throw します。

```ts
.build(): CdlDiagram          // validate 通過後 immutable diagram object を返す
```

戻り値の `CdlDiagram` をそのまま `<CdlDiagramView>` に渡すと表示できます。
build 後は immutable なので、 変更したい場合は新しく builder から作り直してください。

---

## 高位 API ... 6 preset (mermaid 同等)

mermaid の各種図にあたる 6 つの preset を用意しています。
全て内部で `diagram()` builder に compile されるため、 低位 API と互換です。

| preset | mermaid 相当 | 用途 |
|---|---|---|
| `swimlane(...)` | flowchart LR で複数 lane | 並列に作業する actor 群 |
| `flow(...)` | flowchart TB | 縦の処理流れ |
| `sequence(...)` | sequenceDiagram | UML sequence (actor 列 × 時系列) |
| `topology(...)` | C4 / deployment | 構成図 (group + container) |
| `er(...)` | erDiagram | ER (entity + relation) |
| `stateMachine(...)` | stateDiagram-v2 | FSM (state + transition) |

### `sequence(...)`

UML sequence diagram 用の preset です。
actors を配列で渡し、 step を時系列で並べます。

```ts
sequence({
  id: string;
  topic: string;
  actors: string[];                  // 上端 header に並ぶ
  defaultTone?: Tone;
  defaultStyle?: EdgeStyle;
  laneWidth?: number;
})
  .step({ from, to, label, sub?, tone?, style? })
  .step({ ... })
  ...
  .build()
```

`actors` の各文字列が、 自動的に lane の label および lifeline 付き列になります。
step 順序がそのまま画面の縦順序に対応します。

[preview:presets/seq-demo]

### `er(...)`

ER (entity-relationship) 図を 1 関数 + chain で書く preset です。
entity 単位で rows を宣言し、 relation で cardinality を指定します。

```ts
er({ id, topic, defaultTone? })
  .entity({ id, title, rows: ["id: PK", "email: string", ...] })
  .entity({ ... })
  .relation({ from, to, cardinality: "1:N", label?, tone? })
  .build()
```

`rows` は `"カラム名: 型"` の文字列配列で、 表示にそのまま使われます。
`cardinality` には `"1:1"` / `"1:N"` / `"N:M"` 等の文字列を渡せます。

### `stateMachine(...)`

FSM (有限状態機械) を宣言する preset です。
state を並べ、 transition で遷移条件を書きます。

```ts
stateMachine({ id, topic, stateWidth?, defaultTone? })
  .state({ id, title, initial?: true, final?: true })
  .transition({ from, to, trigger, guard?, tone? })
  .build()
```

`initial: true` の state が start node、 `final: true` の state が終端になります。
`trigger` は遷移ラベル、 `guard` は条件式 (副ラベル) として表示されます。

### `swimlane(...)`

複数 lane を横並びにして、 各 lane に node を配置する preset です。
1 個の actor 列ではなく、 並列に動く複数 actor を表現できます。

```ts
swimlane({ id, topic, lanes: ["送信元", "Contract", "出力"], laneWidth? })
  .laneId("送信元")                   // slug 取得
  .node(...).edge(...).phase(...)
  .build()
```

`laneId("送信元")` で内部 slug を取り出せるので、 後続の `.node()` / `.edge()` の lane 引数に渡せます。
日本語 lane 名でも安全に参照できる設計です。

### `flow(...)`

縦に流れる単純なプロセス (1 lane) を最短記法で書く preset です。
sequence と違って actor 列が 1 つだけになります。

```ts
flow({ id, topic, laneLabel, defaultTone? })
  .step({ id, kind, title, eyebrow? }, transitionLabel?: string)
  .step({ ... }, "次のラベル")
  .build()
```

`step(node, label)` の第 2 引数で、 直前の step との間の transition label を指定できます。
何も指定しなければ、 単純な縦の矢印で繋がります。

### `topology(...)`

クラウド構成図のような group + container を宣言する preset です。
C4 や deployment diagram 相当です。

```ts
topology({ id, topic, defaultTone? })
  .group("client", { label: "Client" })
    .add({ id: "browser", kind: "frontend", title: "Browser" })
  .group("aws", { label: "AWS" })
    .add({ id: "alb", kind: "service", title: "ALB", eyebrow: "Load Balancer" })
  .connect("browser", "alb", { label: "HTTPS", sub: "TLS 1.3" })
  .build()
```

`group()` で論理境界を作り、 `add()` で中身を入れていきます。
`connect()` は group をまたいだ container 間の通信線を引きます。

[preview:presets/topo-demo]

---

## React 表示

`build()` で得た `CdlDiagram` を画面に表示するための React コンポーネントです。
通常表示と縮小静止表示の 2 種類を export しています。

```ts
import { CdlDiagramView, CdlDiagramThumbnail } from "@cardenelabs/cdl/react";

<CdlDiagramView diagram={d} hideHeader? />               // 通常表示
<CdlDiagramThumbnail diagram={d} hideHeader? />          // 縮小静止表示
```

`CdlDiagramView` は animation 込みで再生する通常 view、
`CdlDiagramThumbnail` はカタログや一覧用の縮小静止サムネイルです。

---

## validation / verifier API

cdl が独自に持つ「目」 (作者意図 ↔ 画面の照合機構) を呼ぶ関数群です。
3 経路 (`validate` / `verifyDiagramDom` / `verifyAuthorIntent`) があり、 静的検証から実画面検証まで段階的にかけられます。

```ts
import {
  validate,                  // 構造検証 (重複 id / 未定義 ref / 必須 0 件 / 等)、 throw on fail
  layout,                    // viewport 座標計算
  visualValidate,            // 静的 6 軸 (overlap / clearance / alignment / ...)
  visualValidateAll,
  verifyAuthorIntent,        // 作者意図 ↔ 実画面 (Playwright 経由)
  verifyAuthorIntentAll,
  verifyDiagramDom,          // engine 自己整合 (Playwright 経由)
  verifyAllDiagramsDom,
} from "@cardenelabs/cdl";
```

`validate` は同期 throw、 `verifyAuthorIntent` / `verifyDiagramDom` は Playwright Page を渡す非同期関数です。
各経路の使い分けは [Verifier Guide](/docs/cdl/reference/verifier-guide) に詳述しています。

[preview:animation/tween-simple]

---

## NodeKind 一覧 (29 種)

`.node()` の `kind` で指定できる visual 種別の一覧です。
カテゴリごとに整理しており、 用途に合うものを選んでください。

| カテゴリ | NodeKind |
|---|---|
| 基本 | actor / function / storage / event / card |
| 人系 | person / user-group / admin / developer / external-user |
| インフラ | database / cache / queue / message-bus / cloud / cdn |
| アプリ | service / api / frontend / backend / webhook / microservice |
| blockchain | wallet / validator / miner / blockchain-node / mempool / block / bridge-node / relayer |
| 暗号 / データ | signer / oracle / merkle-tree / decision |

各 NodeKind の見本は `/catalog/primitives` ページで visual に確認できます。

## Tone 一覧

`.edge()` の `tone` や preset の `defaultTone` で指定できる色のテーマです。
6 種類のうち accent が default になっています。

| Tone | hex | 意味 |
|---|---|---|
| accent | `#c17f3e` | 中心動作 (default) |
| teal | `#4a8b7f` | データアクセス |
| success | `#6b9e5a` | 成功 / commit |
| warning | `#c9a23e` | 警告 / pending |
| error | `#c15a4a` | 失敗 / revert |
| info | `#5a8ec1` | 情報 / 補足 |

意味は推奨用途であって強制ではありません。
配色テーマを統一したい場合は preset の `defaultTone` でまとめて指定できます。

---

## EdgeStyle 一覧

`.edge()` の `style` で指定できる線種です。
animation 中に粒子を流したいかどうかで選んでください。

| Style | 用途 |
|---|---|
| `"solid"` (default) | 実線 + 矢頭 |
| `"dotted-flow"` | 点線 + active phase で粒子流れ |

`"dotted-flow"` を選んだ edge は、 phase の `activate()` 対象になっている間だけ点線に沿って粒子が流れます。
データ移動や非同期通信を視覚化したいときに有効です。

---

## 関連

このページからの次の docs を案内します。
状況に合わせて移動してください。

- [Quickstart](/docs/cdl/overview/quickstart) ... 5 分で動かしたい場合
- [Cookbook](/docs/cdl/overview/cookbook) ... 実例をコピーして始めたい場合
- [Mermaid Migration](/docs/cdl/overview/mermaid-migration) ... mermaid から移行する場合
- 既存 `../diagram-authoring-api.md` / `../../packages/cdl/SPEC.md` ... 内部仕様
