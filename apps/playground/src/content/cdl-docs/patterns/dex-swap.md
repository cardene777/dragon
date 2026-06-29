# How to diagram a DEX Swap (AMM with constant product)

[preview:patterns/pattern-dex-swap]

DEX Swap は Uniswap 型 DEX (Decentralized Exchange、 中央管理者がいない取引所) の中核 pattern です。
Trader が token A を投入すると、 AMM (Automated Market Maker、 自動 market maker) が **constant product (`x * y = k`、 reserve の積が一定)** という数式に従って token B を返します。
価格は orderbook ではなく reserve 比 (`reserveB / reserveA`) で決まるので、 swap のたびに価格が動きます。

このページでは、 Trader / Router / Pair の 3 lane で reserve 推移を可視化する書き方を示します。

## 前提

このガイドは以下を前提に書かれています。

- cdl の [`diagram()` / `lane()` / `state()` / `phase()` API](/docs/cdl/primitives) を一通り読んでいること
- Uniswap V2 系の constant product AMM (`x * y = k`) を知っていること
- Router contract が複数の Pair をまたいで経路を計算する役割だと知っていること

mermaid では state の数値推移を表現できませんが、 cdl は `state()` + `tween()` で **4 つの state を 1 phase で同時に**滑らかに動かせます。

## 手順

3 つの lane を立て (trader / router / pair)、 4 つの node を配置し、 3 本の edge でつなぎます。
state は reserveA / reserveB / userA / userB の 4 つを宣言し、 最後の settle phase でまとめて tween します。

以下の code をそのままコピーすれば、 完成形が動きます。

::: tabs

@@@ humans 👤 For humans

```text
title: "DEX Swap (AMM)"
type: swimlane

actors:
  - Trader
  - "swap(...)": function
  - "Pair.swap": function
  - reserves: storage

flow:
  - Trader -> "swap(...)": "swap A->B" (dotted-flow)
  - "swap(...)" -> "Pair.swap": "forward" (teal, dotted-flow)
  - "Pair.swap" -> reserves: "update" (warning, dotted-flow)

states:
  reserveA: 1000
  reserveB: 1000
  userA: 100
  userB: 0

animation:
  - step: "Trader -> Router" 1.8s
    focus: [Trader, "swap(...)"]
    badge: "call"

  - step: "Router -> Pair" 1.8s
    focus: ["swap(...)", "Pair.swap"]
    badge: "swap"

  - step: "Reserves 更新" 1.8s
    focus: ["Pair.swap", reserves]
    tween:
      reserveA: 1000 -> 1100
      reserveB: 1000 -> 910
      userA: 100 -> 0
      userB: 0 -> 90
    badge: "settled"
```

@@@ llm 🤖 For LLM

```yaml
diagram: dex-swap
topic: "DEX Swap (AMM)"
lanes:
  - { id: u, x: 0,    width: 280 }
  - { id: r, x: 460,  width: 380 }
  - { id: p, x: 1080, width: 280, contain: true }
state:
  - { id: reserveA, initial: 1000 }
  - { id: reserveB, initial: 1000 }
  - { id: userA,    initial: 100 }
  - { id: userB,    initial: 0 }
nodes:
  - { id: user,     lane: u, stack: 0, kind: actor,    title: "Trader",   value: "{userA}" }
  - { id: router,   lane: r, stack: 0, kind: function, title: "swap(...)", subtitle: "経路計算" }
  - { id: pair,     lane: p, stack: 0, kind: function, title: "Pair.swap", subtitle: "x*y=k" }
  - { id: reserves, lane: p, stack: 1, kind: storage,  title: "reserves", rows: ["A: {reserveA}", "B: {reserveB}"] }
edges:
  - { from: user,   to: router,   label: "swap A→B", style: dotted-flow }
  - { from: router, to: pair,     label: "forward",  tone: teal,    style: dotted-flow }
  - { from: pair,   to: reserves, label: "update",   tone: warning, style: dotted-flow }
phases:
  - { id: call,   duration: 1800, title: "Trader → Router", body: "Router 経由で swap 呼出。", activate: [user, router, user-router], badge: "call" }
  - { id: swap,   duration: 1800, title: "Router → Pair",   body: "Pair contract で constant product 数式により out 算出。", activate: [router, pair, router-pair], badge: "swap" }
  - { id: settle, duration: 1800, title: "Reserves 更新",    body: "reserves が更新、 価格 = reserveB/reserveA が変動。", activate: [pair, reserves, pair-reserves], tween: [{ state: reserveA, from: 1000, to: 1100 }, { state: reserveB, from: 1000, to: 910 }, { state: userA, from: 100, to: 0 }, { state: userB, from: 0, to: 90 }], badge: "settled" }
```

:::

上の code は、 Trader が token A を 100 投入して token B を 90 受け取る swap を再現します。
最後の settle phase で 4 つの state を同時に動かすのが核心です。

v0.5 Text DSL では `lane.x` / `lane.width` / `contain` (Pair lane を枠で囲む) / `node.value` (Trader の手元残高表示) / `node.rows` (reserves の数値表示) を制御できません。
Pair contract 内部の境界 (`contain`) と reserve 数値表示が必要な場合は、 下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では lane の物理位置 (`x` / `width` / `contain`)、 node の `subtitle` / `value` / `rows` を表現できないので、 Pair lane の枠付き表示や reserves 内の `{reserveA}` / `{reserveB}` 数値補間が必要な場合は以下の chain API で宣言します。

```ts
import { diagram } from "@cardenelabs/cdl";

export const dexSwap = diagram("dex-swap", { topic: "DEX Swap (AMM)" })
  .lane("u", { x: 0,    width: 280 })
  .lane("r", { x: 460,  width: 380 })
  .lane("p", { x: 1080, width: 280, contain: true })
  .state("reserveA", { initial: 1000 })
  .state("reserveB", { initial: 1000 })
  .state("userA",    { initial: 100 })
  .state("userB",    { initial: 0 })
  .nodes([
    { id: "user",     lane: "u", stack: 0, kind: "actor",    title: "Trader", value: "{userA}" },
    { id: "router",   lane: "r", stack: 0, kind: "function", title: "swap(...)", subtitle: "経路計算" },
    { id: "pair",     lane: "p", stack: 0, kind: "function", title: "Pair.swap", subtitle: "x*y=k" },
    { id: "reserves", lane: "p", stack: 1, kind: "storage",  title: "reserves", rows: ["A: {reserveA}", "B: {reserveB}"] },
  ])
  .edges([
    { from: "user",   to: "router", label: "swap A→B", style: "dotted-flow" },
    { from: "router", to: "pair",   label: "forward",  tone: "teal",    style: "dotted-flow" },
    { from: "pair",   to: "reserves", label: "update", tone: "warning", style: "dotted-flow" },
  ])
  .phase("call",   { duration: 1800, title: "Trader → Router",  body: "Router 経由で swap 呼出。" },
    (p) => p.activate("user", "router", "user-router").badge("call"))
  .phase("swap",   { duration: 1800, title: "Router → Pair",    body: "Pair contract で constant product 数式により out 算出。" },
    (p) => p.activate("router", "pair", "router-pair").badge("swap"))
  .phase("settle", { duration: 1800, title: "Reserves 更新",     body: "reserves が更新、 価格 = reserveB/reserveA が変動。" },
    (p) => p.activate("pair", "reserves", "pair-reserves")
      .tween("reserveA", 1000, 1100)
      .tween("reserveB", 1000, 910)
      .tween("userA", 100, 0)
      .tween("userB", 0, 90)
      .badge("settled"))
  .build();
```

## Pattern metadata (LLM 向け)

LLM が pattern を機械処理するための完全な declarative metadata です。

```yaml
pattern: dex-swap
intent: "Uniswap V2-style AMM swap — Trader → Router → Pair, constant product x*y=k mutates 4 states (reserves + user balances) in parallel"
lanes:
  - { id: u, role: "Trader (end user)",                       x: 0,    width: 280 }
  - { id: r, role: "Router contract (route computation)",     x: 460,  width: 380 }
  - { id: p, role: "Pair contract (swap logic + reserves)",   x: 1080, width: 280, contain: true }
state:
  - { id: reserveA, initial: 1000, purpose: "token A reserve in Pair pool" }
  - { id: reserveB, initial: 1000, purpose: "token B reserve in Pair pool" }
  - { id: userA,    initial: 100,  purpose: "token A balance held by Trader" }
  - { id: userB,    initial: 0,    purpose: "token B balance held by Trader" }
nodes:
  - { id: user,     lane: u, stack: 0, kind: actor,    title: "Trader",    purpose: "initiates swap A→B" }
  - { id: router,   lane: r, stack: 0, kind: function, title: "swap(...)", purpose: "computes path across Pairs" }
  - { id: pair,     lane: p, stack: 0, kind: function, title: "Pair.swap", purpose: "applies x*y=k constant product" }
  - { id: reserves, lane: p, stack: 1, kind: storage,  title: "reserves",  purpose: "stores reserveA and reserveB" }
edges:
  - { from: user,   to: router,   label: "swap A→B", tone: default, role: "user invokes Router with desired swap" }
  - { from: router, to: pair,     label: "forward",  tone: teal,    role: "Router forwards to target Pair" }
  - { from: pair,   to: reserves, label: "update",   tone: warning, role: "x*y=k mutates reserves storage" }
phases:
  - { id: call,   title: "Trader → Router",  body: "Call swap through Router.",                          duration_ms: 1800, activates: [user, router, user-router], badge: "call" }
  - { id: swap,   title: "Router → Pair",    body: "Pair contract computes output via x*y=k.",           duration_ms: 1800, activates: [router, pair, router-pair], badge: "swap" }
  - { id: settle, title: "Reserves updated", body: "Reserves update, price = reserveB/reserveA shifts.", duration_ms: 1800, activates: [pair, reserves, pair-reserves], tweens: [{ state: reserveA, from: 1000, to: 1100 }, { state: reserveB, from: 1000, to: 910 }, { state: userA, from: 100, to: 0 }, { state: userB, from: 0, to: 90 }], badge: "settled" }
critical_design_points:
  - "settle phase で 4 state を同時 tween し「Trader と pool が同瞬間に資産交換」 を視覚的に伝える"
  - "Pair lane に contain: true を付けて「Router の外、 Pair の中」 という境界を枠で明示"
  - "Router を独立 lane に保持 (Trader → Pair 直結は不可、 経路計算という Router 役割が消える)"
  - "constant product を数値で示す ... 1000×1000 = 1,000,000 → 1100×910 = 1,001,000 で k 保存を確認 (fee 想定で微差)"
common_mistakes:
  - "settle phase で 1 state だけ tween ... 「price は reserve 比だけで決まる」 という AMM 本質が伝わらない"
  - "Trader → Pair 直結で Router 省略 ... 実 Uniswap V2 が Router 必須である事実が消える"
  - "Pair lane の contain を外す ... swap function と reserves storage が同一 contract 内である境界が見えない"
  - "userA / userB の tween 省略 ... Trader 残高が動かず「資産交換」 の片側だけしか見えない"
related_patterns:
  - "multicall ... 同じ Router 経由 pattern、 比較で Router の使い分けが分かる"
  - "approve-pull ... 同じ contain による contract 内部表現の構造"
```

## 確認

ブラウザで diagram を開いて、 以下が見えれば正しく動いています。

- phase 1 (call) で Trader → Router の粒子が流れる
- phase 2 (swap) で Router → Pair の粒子が流れる
- phase 3 (settle) で 4 つの数値が同時に滑らかに動く
  - reserveA が **1000 → 1100** (Trader が投入した A が pool に追加)
  - reserveB が **1000 → 910** (Trader に B が払い出されて pool から減少)
  - userA が **100 → 0** (Trader の手元から A が消える)
  - userB が **0 → 90** (Trader の手元に B が増える)

数値が動かない state がある場合は、 `state()` 宣言と `tween()` の id 名が完全一致しているか確認してください。

[preview:patterns/pattern-dex-swap]

## なぜこう書くか

AMM の docs を読む人が一番知りたいのは、 **「price は何で決まるのか」** です。
固定相場でも oracle 参照でもなく、 **reserve 比だけで決まる**のが AMM の本質です。
言葉で書くと抽象的ですが、 4 つの数値が同時に動くアニメーションで見せると一発で伝わります。

設計のポイントは以下の 3 点です。

- **state を 4 つ並列に tween する** ... reserveA / reserveB / userA / userB を 1 phase で同時に動かすと、 「Trader と pool で資産が交換された」 ことが視覚的に伝わります
- **constant product を数値で示す** ... swap 前は `1000 × 1000 = 1,000,000`、 swap 後は `1100 × 910 = 1,001,000` と、 k がほぼ保たれていることを数値で確認できます (厳密一致しないのは fee 想定のため)
- **Pair lane に `contain: true`** ... Pair contract の内部 (swap 関数 + reserves storage) を枠で囲み、 「Router の外、 Pair の中」 という境界を明示します

Router を独立 lane にしているのは、 実 Uniswap V2 では Router 経由でしか swap しないからです。
Router を省いて Trader → Pair に直結すると、 経路計算という Router の役割が消えてしまいます。

## 関連 docs

- [patterns 一覧](/docs/cdl/patterns/README) でほかの pattern を探せます
- [Multicall](/docs/cdl/patterns/multicall) は同じく Router 経由の pattern で、 比較すると Router の使い分けが分かります
