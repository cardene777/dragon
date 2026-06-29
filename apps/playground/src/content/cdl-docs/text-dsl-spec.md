# CDL Text DSL Specification (v0.5)

`@cardenelabs/cdl` の **Mermaid 感覚 Text DSL** の文法仕様です。
非エンジニア / LLM / 人手の 3 軸を同時に満たす書式として設計しています。

> このページは **Reference** です。
> 文法を引きたい人向けに、 構文要素を網羅的に並べています。
> 「LLM に生成させたい」 場合は [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide)、
> 「builder API から移行したい」 場合は [Migration Guide](/docs/cdl/migration-guide) を参照してください。

## TOC

長いので、 まず目次から該当 section に飛んでください。

- [設計原則](#設計原則)
- [全体構造](#全体構造)
- [構文要素](#構文要素)
  - [`title` / `type`](#title--type)
  - [`actors` (登場人物)](#actors-登場人物)
  - [`flow` (流れ)](#flow-流れ)
  - [`states` / `animation` (アニメーション)](#states--animation-アニメーション)
- [完全例](#完全例)
  - [例 1 ... ログイン flow (sequence)](#例-1--ログイン-flow-sequence)
  - [例 2 ... 送金 animation (sequence + tween)](#例-2--送金-animation-sequence--tween)
  - [例 3 ... 複数 phase (sequential animation)](#例-3--複数-phase-sequential-animation)
- [エラーハンドリング](#エラーハンドリング)
- [i18n 対応](#i18n-対応)
- [バージョン履歴 / 拡張点](#バージョン履歴--拡張点)
- [File extension / Glob 規約](#file-extension--glob-規約)
- [関連](#関連)

## 設計原則

DSL を設計する際に守った 6 つの原則です。
これらが構文選択の根拠になっています。

| 原則 | 内容 |
|---|---|
| Mermaid 感覚 | `mermaid` のように軽量で読みやすい英語 keyword + YAML 風構造 |
| プログラミング感ゼロ | `()` / `{}` / `;` 等の括弧 / 区切り文字をなるべく見せない |
| 自然言語に近い | 値部分は日本語 / 英語 native に書ける (引用符で囲む) |
| LLM フレンドリー | YAML 風 mapping + ラベル付きブロックで構造化 |
| 既存表現力維持 | builder API で表現できる全てを表現可能 (`LaidDiagram` に compile) |
| エラー親切 | 行番号 + 期待値 + 修正提案を提示 |

「Mermaid 感覚」 と「既存表現力維持」 は両立しづらいトレードオフですが、 builder API への compile を経由することで両立させています。
DSL は人が書く / LLM が生成する layer に専念し、 表現力は内部 builder に委譲する設計です。

## 全体構造

DSL 1 file は、 以下 4-6 ブロックで構成されます。
`title` / `type` / `actors` / `flow` の 4 ブロックが必須で、 `states` / `animation` ブロックは省略可能です。

```
title: "<文字列>"
type: <preset 名>            # 12 preset から選択

actors:                       # actor / node / entity の宣言
  - <名前>                    # 種類省略時は actor 扱い
  - <名前>: <種類>            # 種類を colon 形式で指定

flow:                         # edge + 動作の宣言
  - <from> -> <to>: "<ラベル>"
  - <from> -> <to>: "<ラベル>" (<トーン>)

states:                       # animation 用 state の YAML mapping
  <state 名>: <初期値>

animation:                    # phase / tween / set の宣言
  - step: "<phase 名>" <duration>
    focus: [<要素 1>, <要素 2>]
    tween:
      <state 名>: <from> -> <to>
    set:
      <state 名>: "<値>"
    badge: "<ラベル>"
    body: "<本文>"
```

各ブロックは「英語 keyword + コロン + YAML 風配下」 の統一構造です。
LLM が構造を捉えやすく、 parser 側も予測しやすい配置です。

## 構文要素

各ブロックの構文を、 1 つずつ詳しく見ていきます。
細かい挙動は parser の test ケース ( `packages/cdl/src/text-dsl/v05/parser.ts` 周辺) も参照してください。

### `title` / `type`

最上部の 2 行で、 図全体のメタ情報を宣言します。
両方とも必須です。

```
title: "ログインの流れ"
type: sequence
```

`title:` は `LaidDiagram.topic` に対応し、 画面の header に表示されます。
日本語 / 空白を含む値は double quote で囲む必要があります。
`type:` は 12 preset (`sequence` / `flow` / `swimlane` / `er` / `state` / `topology` / `solidity` / `gantt` / `class` / `pie` / `c4` / `mind`) のいずれかを指定します。

### `actors` (登場人物)

`actors:` ブロックで、 図に出てくる actor / node / entity を宣言します。
種類は `- 名前: kind` の colon 形式で指定します。

```
actors:
  - User
  - API: function
  - DB: storage
```

種類を省略すると actor 扱いになります。
書ける種類は 29 NodeKind 全対応 (`actor` / `function` / `storage` / `event` / `cdn` / その他) です。
名前そのものが id として使われるため、 別途 id 振りは不要 (内部で slugify) です。
v0.4 の `- 名前 (kind)` 括弧形式も parser は legacy 互換で受理します。

### `flow` (流れ)

`flow:` ブロックで、 actor 間の矢印を時系列に並べます。
番号 prefix は廃止され、 YAML 風 list 形式に統一されました。

```
flow:
  - User -> API: "ログイン情報"
  - API -> DB: "SELECT" (info)
  - DB -> API: "結果" (success)
  - API -> User: "200 OK" (success)
```

各行は `- <from> -> <to>: "<ラベル>"` 形式です。
矢印は `->` 推奨で、 `→` / `=>` / `>>` も内部正規化されます。
末尾の `(...)` はトーンを表し、 `success` / `error` / `warning` / `info` / `neutral` の英語 keyword (日本語 `成功` / `失敗` / `警告` / `情報` / `中立` も legacy 互換) を書けます。
edge id は `{from-slug}-{to-slug}` で自動生成され、 重複時は連番が付きます。

### `states` / `animation` (アニメーション)

`states:` で animation 用変数を YAML mapping で宣言し、 `animation:` で phase を list で並べます。
省略可能で、 静止図だけ作りたい場合は書かなくて構いません。

#### `states` (状態)

```
states:
  balance: 100
  status: "待機中"
```

YAML mapping 形式で複数 state を一括宣言します。
ここで宣言した state を、 node の `value` / `rows` 内に `{stateId}` 形式で埋めると、 画面に補間値が反映されます。

#### `animation` (step / focus / tween / set / badge / body)

`- step: "<phase 名>" <duration>` で 1 phase を宣言します。
複数並べると、 順番に再生されます。

```
animation:
  - step: "送信" 1.5s
    focus: [User, API]
    set:
      status: "認証中"
    badge: "送信中"
    body: "ユーザーが認証情報を送る"
```

`step:` で phase ID と再生時間を指定します。
duration は `1.5s` / `1500ms` / `2s` の英語短縮形が使えます (v0.4 の `1.5 秒` は legacy 互換)。
子要素の意味は以下のとおりです。

- `focus:` ... builder API の `.activate()` 相当、 array `[a, b]` 形式
- `tween:` ... 線形補間、 YAML mapping (`<state>: <from> -> <to>`)
- `set:` ... 即時切替、 YAML mapping (`<state>: <value>`)
- `badge:` ... `.badge()` 相当
- `body:` ... `phase.body` 相当

#### 状態遷移 (`tween` / `set`)

phase 内の `tween:` / `set:` で state の値を変えます。
`tween:` は線形補間、 `set:` は即時切替です。

```
animation:
  - step: "送金" 1.5s
    tween:
      balance: 100 -> 90       # tween (lerp)
    set:
      status: "完了"            # set (即時)
```

`tween:` は数値 state 専用で、 phase の duration 中に linear 補間します。
`set:` は数値 / 文字列両対応で、 phase 開始時に瞬時に値を切り替えます。

## 完全例

実際の DSL 全体例を 3 つ示します。
各例には builder API への compile 結果を併記しています。

### 例 1 ... ログイン flow (sequence)

最も基本の sequence 図です。
animation 無しの静止図として書けます。

```
title: "ログインの流れ"
type: sequence

actors:
  - User
  - API: function
  - DB: storage

flow:
  - User -> API: "ログイン情報"
  - API -> DB: "SELECT" (info)
  - DB -> API: "結果" (success)
  - API -> User: "200 OK" (success)
```

これを `textDslToDiagram()` に渡すと、 以下の builder API と等価な `CdlDiagram` を得ます。
表現力としては builder API と完全に同等です。

```ts
sequence({
  id: "login",
  topic: "ログインの流れ",
  actors: ["User", "API", "DB"],
})
  .step({ from: "User", to: "API", label: "ログイン情報" })
  .step({ from: "API", to: "DB", label: "SELECT", sub: "info" })
  .step({ from: "DB", to: "API", label: "結果", tone: "success" })
  .step({ from: "API", to: "User", label: "200 OK", tone: "success" })
  .build()
```

DSL 側は 12 行、 builder API 側は 11 行と、 ほぼ同じ行数で書けます。
DSL の利点は「Mermaid 感覚で読みやすい」 「LLM が生成しやすい」 の 2 点です。

[preview:presets/seq-demo]

### 例 2 ... 送金 animation (sequence + tween)

state と tween を使った animation 例です。
v0.5 で完成した典型 case です。

```
title: "送金"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit" (info)
  - Vault -> Bob: "send" (success)

states:
  aliceBalance: 100
  bobBalance: 0

animation:
  - step: "送金" 1.5s
    focus: [Alice, Vault, Alice->Vault]
    tween:
      aliceBalance: 100 -> 90
      bobBalance: 0 -> 10
    body: "Alice が Vault 経由で Bob に 10 送る"
```

これを compile すると、 以下の builder API と等価になります。
低位 builder の boilerplate を、 DSL では大幅に削減できることが分かります。

```ts
diagram("送金", { topic: "送金" })
  .lane("alice", { width: 340, label: "Alice", lifeline: true })
  // ... 各 lane の header / spacer / step box / footer
  .state("aliceBalance", { initial: 100 })
  .state("bobBalance", { initial: 0 })
  .phase(
    "送金",
    { duration: 1500, title: "送金", body: "Alice が Vault 経由で Bob に 10 送る" },
    (p) => p
      .activate("alice-header", "alice-footer", "vault-header", "vault-footer", "e0-alice-vault")
      .tween("aliceBalance", 100, 90)
      .tween("bobBalance", 0, 10),
  )
  .build()
```

builder API では actor の header / footer / spacer 等を 1 つずつ宣言する必要があります。
DSL の compiler が、 これらの boilerplate を自動生成しています。

[preview:presets/seq-demo]

### 例 3 ... 複数 phase (sequential animation)

phase を複数並べた sequential animation の例です。

```
title: "認証 flow"
type: sequence

actors:
  - User
  - Auth: function

flow:
  - User -> Auth: "login"
  - Auth -> User: "token" (success)

states:
  status: "待機"

animation:
  - step: "送信" 1s
    focus: [User, User->Auth]
    set:
      status: "認証中"
    body: "User が credentials を送る"

  - step: "検証" 1s
    focus: [Auth]
    badge: "検証中"
    body: "Auth が credentials を検証"

  - step: "成功" 1s
    focus: [Auth, Auth->User]
    set:
      status: "認証完了"
    badge: "OK"
```

3 つの phase が順番に再生され、 全体で 3 秒の animation になります。
状態 (`status`) は phase をまたいで保持されるので、 phase 間で値を引き継げます。

### legacy 例 ... v0.4 syntax (互換受理)

旧 v0.4 の日本語 keyword + 番号付き形式も parser は受理します。 新規 docs は v0.5 syntax を推奨します。

```
タイトル: ログインの流れ
種類: sequence

登場人物:
  - ユーザー
  - API (function)

流れ:
  1. ユーザー → API: ログイン情報
```

## エラーハンドリング

parser は失敗時に、 行番号 + 期待値 + 修正提案を 1 つにまとめたエラーメッセージを返します。
人が読んで即座に修正できる粒度を目指しています。

### 親切なエラーメッセージ

未宣言 actor を検知した時の出力例です。
何が悪いか、 どう直すかが 2 行で完結します。

```
エラー: 行 5 の「User -> APIサーバー」 ... 「APIサーバー」 が actors にいない。
ヒント: actors に追加するか、 既存の名前 (User, API, DB) を使ってください。
```

`エラー:` 行で原因、 `ヒント:` 行で修正アクションを提示しています。
LLM 出力の自己修正 loop にも、 そのまま渡せる形式です。

### よくあるミス

頻出する記述ミスと、 parser がどう検知 / 提案するかをまとめます。

| ミス | 検知 | 修正案 |
|---|---|---|
| actors 未宣言 | edge に登場 | 「actors に追加 or 名前修正」 |
| 種類タイポ | 未知 NodeKind | 「actor / function / storage 等から選択」 |
| トーンタイポ | `(success)` でなく `(sucess)` 等 | 「success / error / warning から選択」 |
| 引用符忘れ | 日本語値が unquote | 「double quote で囲んでください」 |

引用符忘れ / トーンタイポは parse fail として処理を止め、 修正を促します。

## i18n 対応

v0.5 では英語 keyword が SSOT です。
v0.4 の日本語 keyword は legacy 互換として受理されます。

| v0.5 keyword (SSOT) | v0.4 legacy 互換 |
|---|---|
| `title` | `タイトル` |
| `type` | `種類` |
| `actors` | `登場人物` |
| `flow` / `steps` | `流れ` |
| `states` | `状態` (1 行形式) |
| `animation` / `animate` | `アニメーション` |
| `step` | `ステップ` |
| `focus` / `highlight` / `active` | `強調` |
| `tween` | `遷移` |
| `set` | `切替` |
| `badge` | `バッジ` |
| `body` / `description` | `説明` |
| `success` | `成功` |
| `error` | `失敗` |
| `warning` | `警告` |

英語版で同じ例を書いた場合は、 以下のようになります。
keyword は英語 SSOT で、 値部分のみ言語自由です。

```
title: "Login Flow"
type: sequence

actors:
  - User
  - API: function
  - DB: storage

flow:
  - User -> API: "login credentials"
  - API -> DB: "SELECT" (info)
  - DB -> API: "rows" (success)
  - API -> User: "200 OK" (success)
```

矢印は `→` / `->` / `=>` / `>>` のいずれも受理し、 parser 側で内部正規化します。
ASCII 環境で日本語矢印 `→` が打ちにくい場合でも、 `->` で代用できます。

## バージョン履歴 / 拡張点

各機能の実装状況と、 将来追加予定の機能を一覧化しています。
v0.6 以降の項目は計画段階で、 仕様は変わる可能性があります。

| 機能 | 構文 | 状態 |
|---|---|---|
| **Mermaid 感覚 syntax + 12 preset 完成 (英語 keyword + YAML 風 + 短縮表記)** | `title:` / `type:` / `actors:` / `flow:` / `states:` / `animation:` | **v0.5 (実装済)** |
| アニメーション 6 preset 全対応 (sequence + flow + swimlane + er + state + topology) | `アニメーション:` | v0.4 (実装済) |
| アニメーション full compile (state / tween / set / badge / body / highlight) ... sequence のみ | `アニメーション:` | v0.3 (実装済) |
| 6 preset 全対応 (sequence / flow / swimlane / er / state / topology) | `種類: <preset>` | v0.2 (実装済) |
| コメント | `# コメント` | v0.1 (実装済) |
| エラー hint | 行番号 + 修正案 | v0.1 (実装済) |
| i18n (日本語 + 英語) | `タイトル:` / `title:` | v0.1 (実装済) |
| 矢印正規化 (→ -> => >>) | `A -> B` | v0.1 (実装済) |
| duration 解析 (1.5s / 1500ms / 2s) | `1.5s` | v0.1 (実装済) |
| import / 分割 | `import: ./other.cdl` | v0.6 |
| 条件分岐 | `if: <state> == <値>` | v0.6 |
| ループ | `loop: <state> < <値>` | v0.6 |
| visual editor | (UI) | v1.0 |
| 双方向 sync | (UI) | v2.0 |

### preset 別の解釈 (12 種)

各 preset で `actors` / `flow` がどう解釈されるかを、 1 表で整理します。
preset によって `actors` が actor / entity / state のいずれを意味するかが異なります。

| Preset | actors の役割 | flow の解釈 | 制限 |
|---|---|---|---|
| `sequence` | actors (横並び lifeline) | step (時系列 message) | - |
| `flow` | 縦並び node (1 lane) | 自動 next-step edge | - |
| `swimlane` | lane label | node + edge を auto 配置 | - |
| `er` | entity (rows 無し) | relation、 cardinality は label 内 `(1:N)` 形式 | v0.6 で「列定義」 追加検討 |
| `state` | FSM state、 最初 = initial / 最後 = final | transition (label = trigger、 sub = guard) | - |
| `topology` | 1 group 内 container | connect | v0.6 で複数 group 対応 |
| `solidity` | contract + EOA 中心 (Wallet / Contract / Storage slot) | call / event / emit の時系列 | - |
| `gantt` | task 行 (label + 担当) | task + duration | task 並列は v0.6 |
| `class` | class (attribute + method) | 継承 / 集約 / 実装 relation | - |
| `pie` | slice (label + share) | share % 合計 100 | - |
| `c4` | container (system / container / component) | relation (label = protocol) | C4 Level 1-3 対応 |
| `mind` | root + branch (階層) | parent-child relation | radial layout |

`er` の rows 詳細指定 / `topology` の複数 group は、 現状 builder API でのみ可能です。
DSL での対応は v0.6 以降を予定しています。

## File extension / Glob 規約

DSL を保存する file 拡張子と、 検出方法をまとめます。
docs site の preview 機構もこの規約に従って動きます。

| 用途 | 拡張子 | 検出 |
|---|---|---|
| テキスト DSL ファイル | `.cdl` | `*.cdl` |
| TypeScript builder (互換維持) | `.cdl.ts` | `**/*.cdl.ts` |
| Markdown 中の block | ```` ```cdl ```` | docs site で自動 preview |

Markdown 中の ```` ```cdl ```` block は、 docs site の page render 時に自動で preview に変換されます。
仕様書中の例コードがそのまま動く状態を、 保てるよう設計しています。

## 関連

ここからの次の docs を案内します。

- [Primitives](/docs/cdl/primitives/README) ... DSL が compile される `LaidDiagram` の基本要素
- [Presets](/docs/cdl/presets/README) ... DSL の `type:` で指定する 12 preset
- [API Reference](/docs/cdl/reference/api) ... builder API (v0.x まで public、 v1.0 で internal 化検討)
- [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide) ... LLM に DSL を生成させる手順
- [Migration Guide](/docs/cdl/migration-guide) ... builder API から DSL への移行
