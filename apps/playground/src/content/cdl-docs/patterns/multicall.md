# How to diagram a Multicall (multi-call through a router)

Multicall は **1 transaction で複数の関数呼び出しを実行する** pattern です。
個別に tx を投げるとガス代も遅延も増えますが、 1 tx にまとめることで gas を節約し、 「全部成功するか全部失敗するか」 という atomicity も担保できます。
Uniswap V3 や Multicall3 のような router contract は、 受け取った call data の配列を順に decode して各 target へ転送します。

このページでは、 User が Router を介して 2 つの target を呼ぶ最小構成を cdl で書く手順を示します。

## 前提

このガイドは以下を前提に書かれています。

- cdl の [`diagram()` / `lane()` / `edges()` / `phase()` API](/docs/cdl/primitives) を一通り読んでいること
- ERC-20 や DEX で `multicall` 関数を使った経験、 もしくは存在を知っていること
- `labelOffsetY` の存在を [`primitives/edge.md`](/docs/cdl/primitives/edge) で確認していること (今回 2 本の label を分離するのに使います)

mermaid の `sequenceDiagram` でも 2 つの call を順番に書けますが、 **Router を貫通する**感覚 (Router を経由して target に届くこと) は表現できません。
cdl では Router lane に `contain: true` を付けて、 粒子が Router を物理的に通過する animation を作れます。

## 手順

3 つの lane を立て (user / router / targets)、 4 つの node を配置し、 2 本の edge でつなぎます。
edge の label が同じ source から出ると重なるため、 `labelOffsetY` で path 上下に分散させます。

以下の code をそのままコピーすれば、 完成形が動きます。

::: tabs

@@@ humans 👤 For humans

```text
title: "Multicall (Router 経由)"
type: swimlane

actors:
  - User
  - "multicall([...])": function
  - "Target 1": function
  - "Target 2": function

flow:
  - User -> "Target 1": "call 1" (dotted-flow)
  - User -> "Target 2": "call 2" (teal, dotted-flow)

animation:
  - step: "call 1: User -> Router -> Target 1" 2.4s
    focus: [User, "multicall([...])", "Target 1"]
    badge: "call 1"

  - step: "call 2: User -> Router -> Target 2" 2.4s
    focus: [User, "multicall([...])", "Target 2"]
    badge: "call 2"
```

@@@ llm 🤖 For LLM

```yaml
diagram: multicall
topic: "Multicall (Router 経由)"
lanes:
  - { id: u, x: 0,   width: 280 }
  - { id: r, x: 440, width: 380, contain: true }
  - { id: t, x: 980, width: 280 }
nodes:
  - { id: user,   lane: u, stack: 0, kind: actor,    title: "User" }
  - { id: router, lane: r, stack: 0, kind: function, title: "multicall([...])", subtitle: "貫通" }
  - { id: t1,     lane: t, stack: 0, kind: function, title: "Target 1" }
  - { id: t2,     lane: t, stack: 1, kind: function, title: "Target 2" }
edges:
  - { from: user, to: t1, label: "call 1", style: dotted-flow, labelOffsetY: -160 }
  - { from: user, to: t2, label: "call 2", tone: teal, style: dotted-flow, labelOffsetY: 200 }
phases:
  - { id: call1, duration: 2400, title: "call 1: User → Router → Target 1", body: "粒子が Router を貫通して Target 1 へ。", activate: [user, router, t1, user-t1], badge: "call 1" }
  - { id: call2, duration: 2400, title: "call 2: User → Router → Target 2", body: "同様に Target 2 へ。",                  activate: [user, router, t2, user-t2], badge: "call 2" }
```

:::

上の code は、 User が `multicall([call1, call2])` を 1 度だけ呼び、 内部で 2 つの target が順に呼ばれる流れを 2 phase で再生します。
`flow` の edge は User から `Target 1` / `Target 2` 直結で書いており、 Router lane を粒子が貫通する経路を `animation.focus` で示します。

v0.5 Text DSL では `lane.contain` (Router lane を枠で囲む) / `edge.labelOffsetY` (2 本 label の上下分離) / `node.stack` (Target を縦に並べる) を制御できません。
Router 貫通の枠付き表示や label の上下分離が必要な場合は、 下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では `contain` 枠、 `labelOffsetY` の label 位置調整、 同 lane 内の `stack` 縦並びを表現できないので、 Router 貫通の visual effect が必要な場合は以下の chain API で宣言します。

```ts
import { diagram } from "@cardenelabs/cdl";

export const multicall = diagram("multicall", { topic: "Multicall (Router 経由)" })
  .lane("u", { x: 0,    width: 280 })
  .lane("r", { x: 440,  width: 380, contain: true })
  .lane("t", { x: 980,  width: 280 })
  .nodes([
    { id: "user",   lane: "u", stack: 0, kind: "actor",    title: "User" },
    { id: "router", lane: "r", stack: 0, kind: "function", title: "multicall([...])", subtitle: "貫通" },
    { id: "t1",     lane: "t", stack: 0, kind: "function", title: "Target 1" },
    { id: "t2",     lane: "t", stack: 1, kind: "function", title: "Target 2" },
  ])
  .edges([
    { from: "user", to: "t1", label: "call 1", style: "dotted-flow", labelOffsetY: -160 },
    { from: "user", to: "t2", label: "call 2", tone: "teal", style: "dotted-flow", labelOffsetY: 200 },
  ])
  .phase("call1", { duration: 2400, title: "call 1: User → Router → Target 1", body: "粒子が Router を貫通して Target 1 へ。" },
    (p) => p.activate("user", "router", "t1", "user-t1").badge("call 1"))
  .phase("call2", { duration: 2400, title: "call 2: User → Router → Target 2", body: "同様に Target 2 へ。" },
    (p) => p.activate("user", "router", "t2", "user-t2").badge("call 2"))
  .build();
```

## Pattern metadata (LLM 向け)

LLM が pattern を機械処理するための完全な declarative metadata です。

```yaml
pattern: multicall
intent: "single-tx batch call — User invokes router.multicall([...]) once, router decodes and forwards to N targets atomically"
lanes:
  - { id: u, role: "User (caller submitting 1 tx)",                  x: 0,   width: 280 }
  - { id: r, role: "Router contract (decodes + forwards call data)", x: 440, width: 380, contain: true }
  - { id: t, role: "Target contracts (final call destinations)",     x: 980, width: 280 }
nodes:
  - { id: user,   lane: u, stack: 0, kind: actor,    title: "User",             purpose: "submits 1 tx containing multiple calls" }
  - { id: router, lane: r, stack: 0, kind: function, title: "multicall([...])", purpose: "decodes call data array and forwards to targets" }
  - { id: t1,     lane: t, stack: 0, kind: function, title: "Target 1",         purpose: "first downstream function called" }
  - { id: t2,     lane: t, stack: 1, kind: function, title: "Target 2",         purpose: "second downstream function called" }
edges:
  - { from: user, to: t1, label: "call 1", tone: default, role: "logical call 1 (User → Router → Target 1)", labelOffsetY: -160 }
  - { from: user, to: t2, label: "call 2", tone: teal,    role: "logical call 2 (User → Router → Target 2)", labelOffsetY: 200 }
phases:
  - { id: call1, title: "call 1: User → Router → Target 1", body: "Particle passes through Router to Target 1.", duration_ms: 2400, activates: [user, router, t1, user-t1], badge: "call 1" }
  - { id: call2, title: "call 2: User → Router → Target 2", body: "Same flow, going to Target 2.",                duration_ms: 2400, activates: [user, router, t2, user-t2], badge: "call 2" }
critical_design_points:
  - "Router lane に contain: true を付けて「Router を中継する」 という事実を枠で強調"
  - "edge の from = user、 to = t1 / t2 にして「最終呼び出し先」 を edge 終点として示す (intermediate routing は phase が表現)"
  - "labelOffsetY で 2 本 label を上下に分散 (-160 / +200) し同 source 発の label 重なりを回避"
  - "subtitle: '貫通' (en: 'passthrough') で Router の decode + forward 役割を 2 文字で明示"
common_mistakes:
  - "edge の to を router にする ... 「target が呼ばれる」 事実が消えて Router 止まりに見える"
  - "labelOffsetY 省略 ... 2 本 label が path 中央で重なって読めない"
  - "Router lane の contain を外す ... 粒子が Router を貫通する animation 効果が消える"
  - "1 phase に call 1 と call 2 を詰める ... 順序実行 (call 1 → call 2) が伝わらず並列実行に見える"
related_patterns:
  - "dex-swap ... 同じ Router 経由 pattern、 比較で Router の使い分けが分かる"
  - "approve-pull ... 中央 lane を contain で囲み内部経路を見せる近似構造"
```

## 確認

ブラウザで diagram を開いて、 以下が見えれば正しく動いています。

- Router lane に枠線 (contain) が表示される
- phase 1 (call 1) で User → Router → Target 1 の経路に粒子が流れる
- phase 2 (call 2) で User → Router → Target 2 の経路に粒子が流れる
- 2 本の edge label (「call 1」 と 「call 2」) が縦に分かれて表示され、 重ならない

label が重なって見える場合は、 `labelOffsetY` の値が小さい可能性があります。
今回は -160 と +200 で path から十分離しています。

[preview:patterns/pattern-multicall]

## なぜ `labelOffsetY` を使うのか

同じ source node (今回は `user`) から 2 本以上の edge を引くと、 label のデフォルト位置は path の中央付近に揃ってしまい、 文字が重なって読めなくなります。
`labelOffsetY` は label を path から **垂直方向に**ずらすためのオプションで、 値の単位は px です。
今回 1 本目を `-160` (上)、 2 本目を `+200` (下) に振っているのは、 上下対称に近い形で 2 つの label を視認しやすくするためです。

::: tabs

@@@ humans 👤 For humans

```text
title: "labelOffsetY example"
type: swimlane

actors:
  - User
  - "Target 1": function
  - "Target 2": function

flow:
  - User -> "Target 1": "call 1"
  - User -> "Target 2": "call 2"
```

@@@ llm 🤖 For LLM

```yaml
edges:
  - { from: user, to: t1, label: "call 1", labelOffsetY: -160 }  # 上
  - { from: user, to: t2, label: "call 2", labelOffsetY: 200 }   # 下
```

:::

v0.5 Text DSL では `labelOffsetY` を表現できないため、 label が path 中央付近で重なる場合は下記 chain API を使って手動で上下分離します。

```ts
.edge("user", "t1", { label: "call 1", labelOffsetY: -160 })   // 上に
.edge("user", "t2", { label: "call 2", labelOffsetY: 200 })    // 下に
```

`labelOffsetY` の詳細な仕様 (符号 / 単位 / 上限) は [`primitives/edge.md`](/docs/cdl/primitives/edge) を参照してください。

[preview:patterns/pattern-multicall]

## なぜこう書くか

Multicall を docs で読む人が知りたいのは、 **「個別 tx と 1 tx の違いがどこにあるか」** です。
gas 節約や atomicity は分かっていても、 「内部でどう順に呼ばれるか」 が不透明だと使いどころが判断できません。
cdl で書くと、 Router を貫通する経路を粒子で見せられるので、 1 tx の中で 2 call が連続実行される感覚が直感的に伝わります。

設計のポイントは以下の 3 点です。

- **Router lane に `contain: true`** ... Router 内部に複数 target が並ぶ構造ではないものの、 「Router を中継する」 という事実を枠で囲んで強調します
- **`from: user` で edge を引く** ... User の意図としては「User が target を呼びたい」 ので、 edge の起点を User にして最終呼び出し先を to に書きます
- **`subtitle: "貫通"`** ... Router が tx を decode して各 target に転送する役割を 2 文字で明示します

## 関連 docs

- [patterns 一覧](/docs/cdl/patterns/README) でほかの pattern を探せます
- [primitives/edge.md](/docs/cdl/primitives/edge) で `labelOffsetY` の仕様を確認できます
