# node

`node` は diagram の個別パーツを表す primitive です。
actor / function / storage / event など 29 種の `kind` から選び、 lane の中に縦に並べて配置します。
1 つの node が「人」 「処理」 「データ」 などの実体を表現します。

## API signature

::: tabs

@@@ humans 👤 人間向け

```ts
.node(id: string, opts: {
  lane: string;             // 所属 lane id
  stack: number;            // 縦 stack 番号 (0 から)
  kind: NodeKind;           // 29 種 (actor / function / storage / ...)
  title: string;
  subtitle?: string;
  eyebrow?: string;         // 上部 small label
  value?: string;           // actor / storage で右下 value 表示 ({stateId} 補間可)
  rows?: string[];          // storage の rows ({stateId} 補間可)
  w?: number;               // 幅 override
  h?: number;               // 高さ override
})
```

@@@ llm 🤖 LLM向け

```yaml
fn: .node
args:
  - name: id
    type: string
    required: true
    constraints:
      - "1-32 chars, [a-z0-9-_], unique per diagram"
      - "referenced from edge.from / edge.to / phase.activate"
  - name: opts
    type: object
    required: true
    properties:
      lane: { type: string, required: true, hint: "existing lane id" }
      stack: { type: number, required: true, range: [0, 16], hint: "vertical index in the lane" }
      kind: { type: enum, required: true, values: [actor, function, storage, event, card, person, user-group, admin, developer, external-user, database, cache, queue, message-bus, cloud, cdn, service, api, frontend, backend, webhook, microservice, wallet, validator, miner, blockchain-node, mempool, block, bridge-node, relayer, signer, oracle, merkle-tree, decision] }
      title: { type: string, required: true, max: 32 }
      subtitle: { type: string, optional: true, max: 48 }
      eyebrow: { type: string, optional: true, max: 16, hint: "uppercase small label" }
      value: { type: string, optional: true, hint: "{stateId} interpolation, actor / storage only" }
      rows: { type: array<string>, optional: true, hint: "storage only, {stateId} interpolation" }
      w: { type: number, optional: true, range: [120, 480] }
      h: { type: number, optional: true, range: [60, 320] }
returns: DiagramBuilder
typical_use:
  - "individual element placement in a lane (actor / function / storage etc)"
  - "interpolating dynamic state into a node value or rows"
  - "horizontal alignment via shared stack number across lanes"
constraints:
  - "lane id must be declared before this node"
  - "rows is valid only when kind is 'storage'"
  - "value is valid only when kind is 'actor' or 'storage'"
  - "stack numbers within the same lane must be unique"
common_hallucinations:
  - '.node({ id: ..., lane: ... }) — opts is 2nd arg, not 1st'
  - '.node("a", "lane-l", 0, "actor", "Client") — opts must be object'
  - 'kind: "rectangle" / "circle" — kind is semantic (29 values), not shape'
  - 'opts.x / opts.y — coordinates are derived from lane + stack, not direct'
  - 'rows / value on kind: "function" — only storage (rows) / actor / storage (value)'
```

:::

[preview:primitives/kind-actor]

## 引数

| 引数 | 型 | 必須 | 用途 |
|---|---|---|---|
| `id` | `string` | 必須 | node を識別する一意の ID。 `edge` の `from` / `to` や `phase.activate` から参照します |
| `lane` | `string` | 必須 | 所属させる lane の ID |
| `stack` | `number` | 必須 | 同 lane 内での縦位置 (0 から、 同 stack は全 lane で水平に揃います) |
| `kind` | `NodeKind` | 必須 | node の意味を示す 29 種から選びます |
| `title` | `string` | 必須 | node の主見出し |
| `subtitle` | `string` | 任意 | title 下の補足文 |
| `eyebrow` | `string` | 任意 | node 上部の small uppercase label |
| `value` | `string` | 任意 | 右下に大きく表示する値。 `{stateId}` で `state` を補間できます |
| `rows` | `string[]` | 任意 | storage 用の表形式行。 `{stateId}` 補間が使えます |
| `w` | `number` | 任意 | 幅の override (px) |
| `h` | `number` | 任意 | 高さの override (px) |

## 戻り値

DiagramBuilder を返します。
chain で続けて `.node()` や `.edge()` を呼び出せます。

## 設計意図

> 💡 なぜ `kind` を 29 種に絞ったか
> mermaid や PlantUML は shape (rectangle / cylinder / cloud) を直接指定する API ですが、 cdl は「actor」 「function」 「storage」 のように意味で指定します。
> 意味ベースの kind にすることで、 design system 側で形と色を一貫制御でき、 神経芯系 (neumorphism) の見た目を全 diagram で統一できます。
> 29 種は「人」 「インフラ」 「アプリ」 「blockchain」 「暗号」 のカテゴリに分かれ、 sequence / flowchart / swimlane など全種類の diagram を 1 つの node API でカバーします。

## 基本

最小コードは `lane` と `stack` で配置位置を決め、 `kind` で見た目を選ぶ形です。
同じ `stack` 番号を異なる lane で使うと、 node が水平に揃います。

::: tabs

@@@ humans 👤 人間向け

```text
title: "greet"
type: sequence

actors:
  - Client
  - "greet()": function

flow:
  - Client -> "greet()": "call"
```

@@@ llm 🤖 LLM向け

```yaml
nodes:
  - { id: client, lane: left,  stack: 0, kind: actor,    title: Client }
  - { id: greet, lane: right, stack: 0, kind: function, title: "greet()" }
intent: 同 stack: 0 を異なる lane に置くと水平整列 (layout engine で y 自動計算)
```

:::

[preview:primitives/kind-actor]

v0.5 Text DSL では actor の `kind` を `name: kind` 形式で指定します。
sequence preset では actors が横並び lifeline で配置され、 flow の各 step が同 stack 番号で水平整列します。

## batch 宣言

v0.5 Text DSL では `actors:` 配下に並べるだけで batch 宣言になります。
chain API では `.nodes()` を使うと、 個別宣言と比べて chain の見通しが良くなります。

::: tabs

@@@ humans 👤 人間向け

```text
title: "actors batch"
type: flow

actors:
  - Client
  - Server
  - "greet()": function
```

@@@ llm 🤖 LLM向け

```yaml
nodes:
  - { id: a, lane: l, stack: 0, kind: actor,    title: Client }
  - { id: b, lane: l, stack: 1, kind: actor,    title: Server }
  - { id: c, lane: l, stack: 2, kind: function, title: "greet()" }
intent: batch 宣言で chain 見通し向上 (個別 .node() の連鎖回避)
```

:::

## NodeKind 29 種

`kind` は次の 5 カテゴリ 29 種から選びます。
全 29 種の visual 見本は [`/catalog/primitives`](/catalog/primitives) で確認できます。

| カテゴリ | NodeKind | 用途 |
|---|---|---|
| 基本 5 | `actor` | 人 / 利用者 |
| | `function` | API / 関数呼び出し |
| | `storage` | DB / state / mapping (rows 表示) |
| | `event` | emit event (scale + opacity 動き) |
| | `card` | 汎用カード |
| 人系 5 | `person` / `user-group` / `admin` / `developer` / `external-user` | 詳細な人物分類 |
| インフラ 6 | `database` / `cache` / `queue` / `message-bus` / `cloud` / `cdn` | バックエンド構成 |
| アプリ 6 | `service` / `api` / `frontend` / `backend` / `webhook` / `microservice` | アプリ層構成 |
| blockchain 8 | `wallet` / `validator` / `miner` / `blockchain-node` / `mempool` / `block` / `bridge-node` / `relayer` | ブロックチェーン専用 |
| 暗号 4 | `signer` / `oracle` / `merkle-tree` / `decision` | 暗号 / 判断 |

## storage の rows

`kind: "storage"` を指定した node に `rows: ["key: value", ...]` を渡すと、 表形式で render します。
`{stateId}` で `state` を埋め込むと、 phase 進行で値が animation で変化します。

::: tabs

@@@ humans 👤 人間向け

```text
title: "API"
type: sequence

actors:
  - API: storage

states:
  balance: 100

animation:
  - step: "transfer" 1.5s
    focus: [API]
    tween:
      balance: 100 -> 90
```

@@@ llm 🤖 LLM向け

```yaml
states:
  - { id: balance, initial: 100 }
nodes:
  - id: api
    lane: p
    stack: 1
    kind: storage
    title: API
    rows:
      - "client: {balance}"
      - "server: 0"
intent: storage kind で表形式 render、 {stateId} 補間で phase 進行に同期して値変化
```

:::

[preview:primitives/kind-storage]

v0.5 Text DSL では `kind: storage` の actor が宣言されると、 state 値が自動で rows に bind されます。
phase の tween で `balance` の値が変化すると、 storage 内部の表示も animation で同期更新されます。
rows の細かい formatting (`client: {balance}` 等の literal interpolation) を表現したい場合は chain API を使います。

## actor の value

`kind: "actor"` の node に `value: "{stateId}"` を渡すと、 右下に大きく値を表示します。
カウンターや残高など、 1 つの数値で actor の状態を示したいときに使います。

::: tabs

@@@ humans 👤 人間向け

```text
title: "User Supply"
type: sequence

actors:
  - User

states:
  supply: 0

animation:
  - step: "mint" 1.2s
    focus: [User]
    tween:
      supply: 0 -> 100
```

@@@ llm 🤖 LLM向け

```yaml
states:
  - { id: supply, initial: 0 }
nodes:
  - { id: user, lane: u, stack: 0, kind: actor, title: User, value: "{supply}" }
intent: actor kind の右下大型 value 表示、 1 つの数値で actor 状態を可視化
```

:::

v0.5 Text DSL では state 宣言 + tween 駆動で actor value の自動更新が成立します。
特定 actor に bind する value 表示の literal pattern (`value: "{supply}"`) を細かく制御したい場合は chain API を使います。

## stack 番号

同じ lane 内で `stack: 0, 1, 2, ...` と順に増やすと、 node が縦に並びます。
異なる lane でも同じ stack 番号を使うと、 node が水平に揃います。

::: tabs

@@@ humans 👤 人間向け

```text
title: "horizontal align"
type: sequence

actors:
  - Client
  - greet: function
  - OK: event

flow:
  - Client -> greet: "call"
  - greet -> OK: "emit"
```

@@@ llm 🤖 LLM向け

```yaml
nodes:
  - { id: client,  lane: l, stack: 0, kind: actor,    title: Client }   # 上
  - { id: greet,  lane: r, stack: 0, kind: function, title: greet }   # 上 (client と水平)
  - { id: result, lane: r, stack: 1, kind: event,    title: OK }      # 下
intent: 同 stack = 水平整列、 同 lane で stack 増分 = 縦並び (順番だけ宣言、 y 座標は layout engine 計算)
```

:::

v0.5 Text DSL では `stack` を明示する必要がなく、 actors の宣言順と flow の time order から layout engine が自動計算します。

> 💡 なぜ stack 番号で y 位置を決めるか
> y 座標を直接指定する API にすると、 node の追加 / 削除のたびに全体を再計算する必要があります。
> stack 番号にすることで「順番」 だけ宣言し、 高さは layout engine が自動計算します。

## subtitle / eyebrow

title の補足情報を表示する 2 種類の field を用意しています。
それぞれ表示位置と用途が異なります。

| field | 表示位置 | 用途 |
|---|---|---|
| `eyebrow` | node 上部の small uppercase label | kind 識別用 (例 `STATE` / `ENTITY`) |
| `subtitle` | title 下の補足文 | 補足説明 (例 `署名のみ (gas 0)`) |

::: tabs

@@@ humans 👤 人間向け

```text
title: "Owner Node"
type: sequence

actors:
  - Owner
```

@@@ llm 🤖 LLM向け

```yaml
nodes:
  - id: owner
    lane: o
    stack: 0
    kind: actor
    title: Owner
    eyebrow: USER          # node 上部の small uppercase label (kind 識別)
    subtitle: "署名のみ (gas 0)"  # title 下の補足文
intent: eyebrow (上部 uppercase) と subtitle (下部補足) で title を 3 層化
```

:::

[preview:primitives/kind-actor]

v0.5 Text DSL では `eyebrow` / `subtitle` を直接表現できないため、 これらの補足表示は chain API で指定します。

## API Reference (chain API)

v0.5 Text DSL で表現できない `eyebrow` / `subtitle` / `rows` literal interpolation / `w` / `h` の override が必要な場合は builder API を使います。

```ts
.node("client", { lane: "left", stack: 0, kind: "actor", title: "Client" })
.node("greet", { lane: "right", stack: 0, kind: "function", title: "greet()" })

.nodes([
  { id: "a", lane: "l", stack: 0, kind: "actor",    title: "Client" },
  { id: "b", lane: "l", stack: 1, kind: "actor",    title: "Server" },
  { id: "c", lane: "l", stack: 2, kind: "function", title: "greet()" },
])

.state("balance", { initial: 100 })
.node("api", {
  lane: "p",
  stack: 1,
  kind: "storage",
  title: "API",
  rows: ["client: {balance}", "server: 0"],
})

.state("supply", { initial: 0 })
.node("user", { lane: "u", stack: 0, kind: "actor", title: "User", value: "{supply}" })

.node("owner", {
  lane: "o", stack: 0,
  kind: "actor",
  title: "Owner",
  eyebrow: "USER",
  subtitle: "署名のみ (gas 0)",
})
```

## 関連

- [lane](/docs/cdl/primitives/lane) ... node を含む列です
- [edge](/docs/cdl/primitives/edge) ... node 間の関連を表します
- [state](/docs/cdl/primitives/state) ... `node.value` や `node.rows` で参照します
- [API Reference](/docs/cdl/reference/api#node) ... 全 field の型定義です
