# Quickstart ... 5 step で動く図を作る

このチュートリアルでは、 cdl Text DSL v0.5 (YAML 風の宣言文法) を使って 5 step で動く図を作ります。
各 step は 5 分で完走でき、 全 step を終えると preset 6 種と animation の主要機能を一通り体験できます。

> 💡 **mermaid との違い** ... mermaid の `sequenceDiagram` は静止 SVG を出しますが、 cdl は React コンポーネントを返し、 edge 上を粒子 (particle、 矢印に沿って流れる動く点) が時系列で流れます。 mermaid の感覚で書ける YAML 風記法を踏襲しているので、 mermaid 経験者は 10 分で雰囲気を掴めます。

## 前提

このチュートリアルを進める前に、 以下が揃っていることを確認してください。

| 必要なもの | 確認方法 |
|---|---|
| Node.js 20 以上と pnpm | `pnpm -v` で 8.x 以降が表示される |
| React 19 系の Next.js / Vite / Astro プロジェクト | `package.json` の `react` が 19.x |
| TypeScript 5 系 | `tsconfig.json` が `strict: true` |

最初に cdl 本体と React 依存パッケージをインストールしてください。

```bash
pnpm add @cardenelabs/cdl react react-dom
```

`package.json` の `dependencies` に `@cardenelabs/cdl` が追加されていれば準備完了です。

## Step 1 ... 最初の図 (2 actor + 1 arrow の sequence)

最も小さい sequence 図を Text DSL で書きます。
User が API を呼ぶ 1 step だけの図です。

```text
title: "Hello"
type: sequence

actors:
  - User
  - API

flow:
  - User -> API: "request"
```

[preview:presets/seq-demo]

この 7 行を `hello.cdl` として保存して、 React コンポーネントに渡せば動く図になります。
TypeScript からは以下のように呼び出してください。

```ts
import { textDslToDiagram } from "@cardenelabs/cdl";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const hello = textDslToDiagram(`
title: "Hello"
type: sequence

actors:
  - User
  - API

flow:
  - User -> API: "request"
`);

export const App = () => <CdlDiagramView diagram={hello} />;
```

ポイントは 4 つあります。
`title:` は画面の header に表示される文字列、 値が日本語なら quote (`" "`) で囲みます。
`type:` は `sequence` / `flow` / `swimlane` / `er` / `state` / `topology` の 6 preset から選びます。
`actors:` 配下の `- User` で actor (登場人物) を 1 行 1 人ずつ宣言します。
`flow:` 配下の `- User -> API: "request"` で edge (矢印) を時系列順に並べます。

`->` の左辺が from、 右辺が to、 コロン以降の文字列が label です。
矢印は `->` / `→` / `=>` のいずれも受理します。

> 💡 **なぜ Text DSL なのか** ... TypeScript builder API (`diagram().lane().node().edge().build()`) は型補完が効く反面、 短い宣言には冗長です。 Text DSL は LLM に生成させやすく、 非エンジニアでも読み書きできる YAML 風の薄い層として設計しています。

次の Step では animation を追加して、 値が時間とともに動く図に拡張します。

[次へ ... Step 2 animation 追加](#step-2--animation-を追加する-state--tween)

## Step 2 ... animation を追加する (state + tween)

Step 1 の静止図に animation (時間に沿って値が動く演出) を追加します。
カウンタが 0 から 10 へ滑らかに増えていく図を書きます。

```text
title: "Counter"
type: sequence

actors:
  - User
  - Counter: { kind: actor, value: "{count}" }

flow:
  - User -> Counter: "increment"

states:
  count: 0

animation:
  - step: "tap" 1.5s
    focus: [User, Counter]
    tween:
      count: 0 -> 10
    badge: "+10"
```

[preview:animation/tween-simple]

新しく登場したブロックは 2 つです。
`states:` で animation で動かす変数を宣言します (`count: 0` で初期値 0)。
`animation:` 配下に `step:` を並べて、 各 step に focus (強調する actor) と tween (値を線形補間する命令) を書きます。

`actors:` 側の `Counter: { kind: actor, value: "{count}" }` は inline option (1 行で書く詳細指定) です。
`value:` に `{count}` という placeholder を埋めると、 animation 中 Counter の表示が 0 → 10 に滑らかに変化します。

`tween:` は数値 state 専用の線形補間命令です。
phase の duration (`1.5s` = 1500ms) 中に値が `from` から `to` まで補間されます。

> 💡 **tween と set の違い** ... `tween` は数値を linear に補間する命令で、 滑らかなアニメーションになります。 一方 `set` は数値 / 文字列の即時切替 (`status: "loading"` → `status: "done"`) です。 後の Step 3 で `set` を使います。

次の Step では複数 phase を連続再生して、 値が累積する図を書きます。

[次へ ... Step 3 複数 phase](#step-3--複数-phase-を順番に再生する)

## Step 3 ... 複数 phase を順番に再生する

phase を複数並べると、 順番に再生されて累積動作が表現できます。
カウンタが 0 → 1 → 3 → 6 と 3 step で増える図を書きます。

```text
title: "Sequential Counter"
type: sequence

actors:
  - User
  - Counter: { kind: actor, value: "{count}" }

flow:
  - User -> Counter: "+1"
  - User -> Counter: "+2"
  - User -> Counter: "+3"

states:
  count: 0

animation:
  - step: "+1" 1.0s
    focus: [Counter]
    tween:
      count: 0 -> 1
    badge: "1"

  - step: "+2" 1.0s
    focus: [Counter]
    tween:
      count: 1 -> 3
    badge: "3"

  - step: "+3" 1.0s
    focus: [Counter]
    tween:
      count: 3 -> 6
    badge: "6"
```

[preview:animation/tween-simple]

phase を 3 つ並べたので、 全体で 3 秒の animation になります。
phase 間で state (`count`) は保持されるため、 phase 2 の `from: 1` は phase 1 の `to: 1` を引き継ぎます。

`set` を使った文字列 state の例も見ておきます。
status が `idle` → `loading` → `done` と即時切替する図です。

```text
title: "Auth State"
type: flow

actors:
  - User
  - API: function

flow:
  - User -> API: "submit"

states:
  status: "idle"

animation:
  - step: "submit" 0.8s
    focus: [User, API]
    set:
      status: "loading"
    badge: "loading"

  - step: "done" 1.2s
    focus: [API]
    set:
      status: "done"
    badge: "done"
```

`tween:` を `set:` に置き換えると、 文字列の即時切替になります。
数値も `set:` で即時切替できますが、 滑らかに動かしたい場合は `tween:` を使ってください。

[次へ ... Step 4 他 preset を試す](#step-4--他-preset-を試す)

## Step 4 ... 他 preset を試す

`type:` に指定できる preset は 6 種類あります。
それぞれ用途と簡単な例を見ていきましょう。

### `flow` ... 縦並び の単純フロー

縦に 1 列で node を並べる図です。
処理の連鎖を上から下に書きたいときに使います。

```text
title: "Order Flow"
type: flow

actors:
  - Cart
  - Checkout: function
  - Payment: service
  - Done

flow:
  - Cart -> Checkout: "submit"
  - Checkout -> Payment: "charge"
  - Payment -> Done: "ok" (success)
```

[preview:presets/flow-demo]

### `swimlane` ... 役割別 lane に分けた水平フロー

役割 (Sender / Contract / Receiver 等) ごとに lane (横方向の列) を分ける図です。
mermaid の `flowchart LR` 相当です。

```text
title: "ERC20 Transfer"
type: swimlane

actors:
  - Client
  - "transfer()": function
  - Server

flow:
  - Client -> "transfer()": "call"
  - "transfer()" -> Server: "emit" (success)
```

[preview:presets/swim-demo]

### `er` ... ER 図 (entity-relation)

データベーステーブル間の関係を描く図です。
mermaid の `erDiagram` 相当です。

```text
title: "User-Order schema"
type: er

actors:
  - User: { kind: entity, rows: ["id: PK", "email: string", "createdAt: timestamp"] }
  - Order: { kind: entity, rows: ["id: PK", "userId: FK", "total: number"] }

flow:
  - User -> Order: "places" { cardinality: "1:N" }
```

[preview:presets/er-demo]

`cardinality:` (基数、 1:1 / 1:N / N:M のいずれか) を inline option で指定します。
`rows:` 配列の各文字列が 1 カラムを表します。

### `state` ... 状態遷移図 (state machine)

状態 (Idle / Loading / Done / Error 等) と遷移を描く図です。
mermaid の `stateDiagram-v2` 相当です。

```text
title: "Auth state"
type: state

actors:
  - Idle: { kind: state, initial: true }
  - Loading: { kind: state }
  - Done: { kind: state, final: true }
  - Error: { kind: state }

flow:
  - Idle -> Loading: "submit"
  - Loading -> Done: "success" (success)
  - Loading -> Error: "fail" (error)
  - Error -> Idle: "retry" { guard: "if attempts < 3" }
```

[preview:presets/fsm-demo]

`initial: true` で開始状態、 `final: true` で終了状態を宣言します。
`guard:` (遷移条件) は inline option で渡します。

### `topology` ... システム構成図

複数 group (Client / AWS / DB 等) にまたがるシステム配置を描く図です。
mermaid の C4 風相当です。

```text
title: "AWS deployment"
type: topology

actors:
  - Browser
  - ALB: service
  - "ECS Task": service
  - RDS: database

flow:
  - Browser -> ALB: "HTTPS"
  - ALB -> "ECS Task": "round-robin"
  - "ECS Task" -> RDS: "TCP 5432" (success)
```

[preview:presets/topo-demo]

[次へ ... Step 5 inline option](#step-5--inline-option-で詳細を制御する)

## Step 5 ... inline option で詳細を制御する

ここまでで preset と animation の基本を体験しました。
最後に inline option (`{ key: value, ... }` で 1 行に詳細指定を埋める書式) で細かい制御を見ていきます。

### actor の inline option

actor 側で使える option は以下 6 種類です。

| option | 用途 | 例 |
|---|---|---|
| `kind:` | 29 種類の visual kind から選ぶ | `kind: storage` |
| `subtitle:` | actor の下に添える補足文字列 | `subtitle: "送信元"` |
| `eyebrow:` | actor の上に添える小ラベル | `eyebrow: "User"` |
| `value:` | 動的値 placeholder | `value: "{count}"` |
| `rows:` | 行配列 (entity の column 等) | `rows: ["id: PK", "name: string"]` |
| `initial:` / `final:` | state 開始 / 終了マーカー | `initial: true` |

```text
title: "Inline option demo"
type: sequence

actors:
  - Owner: { kind: actor, subtitle: "署名のみ (gas 0)" }
  - Spender: { kind: actor, eyebrow: "relayer" }
  - Counter: { kind: storage, value: "{balance}", rows: ["amt: {balance}"] }

flow:
  - Owner -> Spender: "send sig"
  - Spender -> Counter: "execute"

states:
  balance: 0

animation:
  - step: "execute" 1.5s
    focus: [Counter]
    tween:
      balance: 0 -> 100
    badge: "+100"
```

### flow の inline option

flow 側 (edge) で使える option は以下 5 種類です。

| option | 用途 | 例 |
|---|---|---|
| `sub:` | label 下の補足文字列 | `sub: "EIP-712 signature"` |
| `cardinality:` | ER 図の基数 | `cardinality: "1:N"` |
| `guard:` | state 遷移条件 | `guard: "if attempts < 3"` |
| `labelOffsetX:` | label の X 方向ずらし | `labelOffsetX: 150` |
| `labelOffsetY:` | label の Y 方向ずらし | `labelOffsetY: -8` |

```text
title: "Edge inline option demo"
type: er

actors:
  - User: { kind: entity, rows: ["id: PK", "email: string"] }
  - Order: { kind: entity, rows: ["id: PK", "userId: FK", "total: number"] }

flow:
  - User -> Order: "places" { sub: "1 user owns many orders", cardinality: "1:N", labelOffsetY: -8 }
```

[preview:presets/er-demo]

### tone と style の (parens) 記法

flow の末尾 `(...)` で tone (色) と style (線種) を 1 行で指定できます。

| 値 | 種類 | 効果 |
|---|---|---|
| `success` | tone | 緑色 (成功応答) |
| `error` | tone | 赤色 (失敗) |
| `warning` | tone | 黄色 (警告) |
| `info` | tone | 青色 (情報) |
| `accent` | tone | アクセント色 |
| `teal` | tone | 補助 teal 色 |
| `dotted-flow` | style | 点線 + 粒子が流れる |
| `solid` | style | 実線 |

```text
title: "Tone & style demo"
type: sequence

actors:
  - User
  - API: function
  - DB: storage

flow:
  - User -> API: "POST /login" (info)
  - API -> DB: "SELECT" (accent, dotted-flow)
  - DB -> API: "rows" (success)
  - API -> User: "200 OK" (success, dotted-flow)
```

[preview:presets/seq-demo]

tone と style を両方指定したい場合は `(success, dotted-flow)` のようにカンマ区切りで並べます。
順序は不問で、 parser が自動判別します。

### viewport で canvas size を制御する

大きな図で全体を 1 画面に収めたい場合は、 viewport 宣言で canvas size を指定できます。

```text
title: "Wide canvas"
type: sequence

viewport: { width: 1400, height: 900, laneWidth: 480, gap: 80 }

actors:
  - A
  - B

flow:
  - A -> B: "hello"
```

## エラーが出たときは

### `Cannot find module '@cardenelabs/cdl'`

**原因** ... 最初のインストールが完了していない、 または依存解決のキャッシュが古い。

**修正例**:

```bash
pnpm install
pnpm add @cardenelabs/cdl
```

### `unknown type: "..."`

**原因** ... `type:` に 6 preset 以外の文字列を渡している。

**修正例** ... `sequence` / `flow` / `swimlane` / `er` / `state` / `topology` のいずれかに置き換えてください。

### `invalid actor entry: "..."`

**原因** ... actor の inline option `{ ... }` で colon (`:`) の対応が崩れている、 または quote が不一致。

**修正例** ... 値に日本語や空白が含まれる場合は必ず `"..."` で囲み、 inline option は `{ key: value, key: value }` 形式で書いてください。

### `invalid flow entry: "..."`

**原因** ... `->` の左右が空、 または label の quote が閉じていない。

**修正例**:

```diff
- - User -> : "request"
+ - User -> API: "request"
```

## 次のステップ

このチュートリアルで cdl Text DSL v0.5 の主要機能を体験できました。
次に進む先は、 あなたが何をしたいかで変わります。

- 用途別の実用例を見たい → [Cookbook](/docs/cdl/overview/cookbook) で 25 例 (DeFi / NFT / DAO / Bridge カテゴリ別)
- 文法を網羅的に引きたい → [Text DSL Specification](/docs/cdl/text-dsl-spec) で全構文要素
- mermaid から乗り換えたい → [Mermaid Migration](/docs/cdl/overview/mermaid-migration) で 1:1 対応表
- LLM に DSL を生成させたい → [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide)
