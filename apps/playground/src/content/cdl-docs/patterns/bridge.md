# How to diagram a cross-chain Bridge (Lock-Mint)

[preview:patterns/pattern-bridge]

Bridge は **元 chain で資産を lock し、 別 chain で同量を mint** することで cross-chain 送金を成立させる pattern です。
Lock-Mint 方式と呼ばれ、 WBTC や旧 Polygon PoS bridge など多くの bridge で採用されています。
中央の relayer (または validator 集合) が cross-chain message を伝達し、 元と先の chain で残高が一致するように動きます。

このページでは、 source chain / bridge / destination chain の 3 lane に分けて、 lock → relay → mint の 3 phase で動かす書き方を示します。

## 前提

このガイドは以下を前提に書かれています。

- cdl の [`diagram()` / `lane()` / `nodes()` / `state()` / `phase()` API](/docs/cdl/primitives) を一通り読んでいること
- cross-chain bridge の概念 (元 chain と先 chain で同じ token を扱うこと) を知っていること
- ERC-20 の `lock` と `mint` 関数の意味を知っていること

mermaid の `sequenceDiagram` でも 3 chain の流れは書けますが、 **chain 境界**を視覚的に強調できません。
cdl の `contain: true` で source / dest lane を枠で囲むと、 chain ごとの閉じた世界として表現できます。

## 手順

3 つの lane を立てて (source / bridge / dest)、 6 つの node を配置し、 5 本の edge でつなぎます。
state は `locked` (元 chain) と `minted` (先 chain) の 2 つを別に持たせ、 phase 内で順に tween します。

以下の code をそのままコピーすれば、 完成形が動きます。

::: tabs

@@@ humans 👤 For humans

```text
title: "Bridge Lock-Mint"
type: swimlane

actors:
  - User
  - "lock(amt)": function
  - Vault: storage
  - Relayer: function
  - "mint(amt)": function
  - Receiver

flow:
  - User -> "lock(amt)": "lock" (dotted-flow)
  - "lock(amt)" -> Vault: "store" (teal, dotted-flow)
  - "lock(amt)" -> Relayer: "msg" (info, dotted-flow)
  - Relayer -> "mint(amt)": "relay" (info, dotted-flow)
  - "mint(amt)" -> Receiver: "send" (success, dotted-flow)

states:
  locked: 0
  minted: 0

animation:
  - step: "Source: lock" 1.8s
    focus: [User, "lock(amt)", Vault]
    tween:
      locked: 0 -> 10
    badge: "locked"

  - step: "Relayer: msg pass" 1.8s
    focus: ["lock(amt)", Relayer, "mint(amt)"]
    badge: "relay"

  - step: "Dest: mint + send" 1.8s
    focus: ["mint(amt)", Receiver]
    tween:
      minted: 0 -> 10
    badge: "minted"
```

@@@ llm 🤖 For LLM

```yaml
diagram: bridge
topic: "Bridge Lock-Mint"
lanes:
  - { id: src, x: 0,    width: 280, contain: true }
  - { id: br,  x: 540,  width: 380 }
  - { id: dst, x: 1140, width: 280, contain: true }
state:
  - { id: locked, initial: 0 }
  - { id: minted, initial: 0 }
nodes:
  - { id: user,    lane: src, stack: 0, kind: actor,    title: "User" }
  - { id: lockFn,  lane: src, stack: 1, kind: function, title: "lock(amt)" }
  - { id: vault,   lane: src, stack: 2, kind: storage,  title: "Vault",     rows: ["locked: {locked}"] }
  - { id: relayer, lane: br,  stack: 0, kind: function, title: "Relayer",   subtitle: "message" }
  - { id: mintFn,  lane: dst, stack: 0, kind: function, title: "mint(amt)" }
  - { id: recv,    lane: dst, stack: 1, kind: actor,    title: "Receiver",  value: "{minted}" }
edges:
  - { from: user,    to: lockFn,  label: "lock",  style: dotted-flow }
  - { from: lockFn,  to: vault,   label: "store", tone: teal,    style: dotted-flow }
  - { from: lockFn,  to: relayer, label: "msg",   tone: info,    style: dotted-flow }
  - { from: relayer, to: mintFn,  label: "relay", tone: info,    style: dotted-flow }
  - { from: mintFn,  to: recv,    label: "send",  tone: success, style: dotted-flow }
phases:
  - { id: lock,  duration: 1800, title: "Source: lock",      body: "Source chain で資産を vault に lock。",        activate: [user, lockFn, vault, user-lockFn, lockFn-vault], tween: [{ state: locked, from: 0, to: 10 }], badge: "locked" }
  - { id: relay, duration: 1800, title: "Relayer: msg pass", body: "Bridge relayer が cross-chain メッセージを伝達。", activate: [lockFn, relayer, mintFn, lockFn-relayer, relayer-mintFn], badge: "relay" }
  - { id: mint,  duration: 1800, title: "Dest: mint + send", body: "Dest chain で同量を mint して receiver に送る。", activate: [mintFn, recv, mintFn-recv], tween: [{ state: minted, from: 0, to: 10 }], badge: "minted" }
```

:::

上の code は、 source chain の `User → lock(amt) → Vault` から始まり、 中央の relayer が cross-chain message を運び、 destination chain の `mint(amt) → Receiver` に着地する流れを 3 phase で再生します。
`contain: true` を src / dst の両 lane に付けると、 chain 境界を枠で囲んで「ここから先は別 chain」 と一目で分かるようになります。

v0.5 Text DSL では `lane.x` / `lane.width` / `contain` (枠付き) / `node.stack` / `node.subtitle` / `node.rows` / `node.value` を制御できません。
chain 境界の `contain` 枠や Vault 内の数値表示 (`rows`) を厳密に再現したい場合は、 下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では lane の物理位置 (`x` / `width` / `contain`)、 node の `stack` / `subtitle` / `rows` / `value` を表現できないので、 chain 境界の枠付き表示や Vault 内の `locked` 数値を表示したい場合は以下の chain API で宣言します。

```ts
import { diagram } from "@cardenelabs/cdl";

export const bridge = diagram("bridge", { topic: "Bridge Lock-Mint" })
  .lane("src", { x: 0,    width: 280, contain: true })
  .lane("br",  { x: 540,  width: 380 })
  .lane("dst", { x: 1140, width: 280, contain: true })
  .state("locked", { initial: 0 })
  .state("minted", { initial: 0 })
  .nodes([
    { id: "user",    lane: "src", stack: 0, kind: "actor",    title: "User" },
    { id: "lockFn",  lane: "src", stack: 1, kind: "function", title: "lock(amt)" },
    { id: "vault",   lane: "src", stack: 2, kind: "storage",  title: "Vault", rows: ["locked: {locked}"] },
    { id: "relayer", lane: "br",  stack: 0, kind: "function", title: "Relayer", subtitle: "message" },
    { id: "mintFn",  lane: "dst", stack: 0, kind: "function", title: "mint(amt)" },
    { id: "recv",    lane: "dst", stack: 1, kind: "actor",    title: "Receiver", value: "{minted}" },
  ])
  .edges([
    { from: "user",    to: "lockFn",  label: "lock",  style: "dotted-flow" },
    { from: "lockFn",  to: "vault",   label: "store", tone: "teal", style: "dotted-flow" },
    { from: "lockFn",  to: "relayer", label: "msg",   tone: "info", style: "dotted-flow" },
    { from: "relayer", to: "mintFn",  label: "relay", tone: "info", style: "dotted-flow" },
    { from: "mintFn",  to: "recv",    label: "send",  tone: "success", style: "dotted-flow" },
  ])
  .phase("lock",  { duration: 1800, title: "Source: lock",      body: "Source chain で資産を vault に lock。" },
    (p) => p.activate("user", "lockFn", "vault", "user-lockFn", "lockFn-vault").tween("locked", 0, 10).badge("locked"))
  .phase("relay", { duration: 1800, title: "Relayer: msg pass", body: "Bridge relayer が cross-chain メッセージを伝達。" },
    (p) => p.activate("lockFn", "relayer", "mintFn", "lockFn-relayer", "relayer-mintFn").badge("relay"))
  .phase("mint",  { duration: 1800, title: "Dest: mint + send", body: "Dest chain で同量を mint して receiver に送る。" },
    (p) => p.activate("mintFn", "recv", "mintFn-recv").tween("minted", 0, 10).badge("minted"))
  .build();
```

## Pattern metadata (LLM 向け)

LLM が pattern を機械処理するための完全な declarative metadata です。

```yaml
pattern: bridge
intent: "cross-chain Lock-Mint bridge — lock asset on source chain, relayer carries message, mint same amount on destination chain"
lanes:
  - { id: src, role: "Source chain (asset originates here)",    x: 0,    width: 280, contain: true }
  - { id: br,  role: "Bridge relay path (off-chain or validator set)", x: 540,  width: 380 }
  - { id: dst, role: "Destination chain (mint occurs here)",    x: 1140, width: 280, contain: true }
state:
  - { id: locked, initial: 0, purpose: "amount locked in source-chain Vault" }
  - { id: minted, initial: 0, purpose: "amount minted on destination chain to Receiver" }
nodes:
  - { id: user,    lane: src, stack: 0, kind: actor,    title: "User",     purpose: "initiates bridge tx on source chain" }
  - { id: lockFn,  lane: src, stack: 1, kind: function, title: "lock(amt)", purpose: "source-chain entrypoint that locks asset" }
  - { id: vault,   lane: src, stack: 2, kind: storage,  title: "Vault",    purpose: "holds locked asset on source chain" }
  - { id: relayer, lane: br,  stack: 0, kind: function, title: "Relayer",  purpose: "carries cross-chain message src → dst" }
  - { id: mintFn,  lane: dst, stack: 0, kind: function, title: "mint(amt)", purpose: "destination-chain entrypoint that mints asset" }
  - { id: recv,    lane: dst, stack: 1, kind: actor,    title: "Receiver", purpose: "final destination of minted asset" }
edges:
  - { from: user,    to: lockFn,  label: "lock",  tone: default, role: "user invokes lock on source" }
  - { from: lockFn,  to: vault,   label: "store", tone: teal,    role: "asset persisted in vault storage" }
  - { from: lockFn,  to: relayer, label: "msg",   tone: info,    role: "lock event emits cross-chain message" }
  - { from: relayer, to: mintFn,  label: "relay", tone: info,    role: "relayer delivers message to dst chain" }
  - { from: mintFn,  to: recv,    label: "send",  tone: success, role: "minted asset transferred to receiver" }
phases:
  - { id: lock,  title: "Source: lock",      body: "Lock asset into vault on source chain.",            duration_ms: 1800, activates: [user, lockFn, vault, user-lockFn, lockFn-vault], tweens: [{ state: locked, from: 0, to: 10 }], badge: "locked" }
  - { id: relay, title: "Relayer: msg pass", body: "Bridge relayer carries the cross-chain message.",   duration_ms: 1800, activates: [lockFn, relayer, mintFn, lockFn-relayer, relayer-mintFn], badge: "relay" }
  - { id: mint,  title: "Dest: mint + send", body: "Mint same amount on dst chain and send to receiver.", duration_ms: 1800, activates: [mintFn, recv, mintFn-recv], tweens: [{ state: minted, from: 0, to: 10 }], badge: "minted" }
critical_design_points:
  - "source / bridge / destination を 3 lane に分離して chain 境界を物理的に表現"
  - "src と dst の両 lane に contain: true を付けて chain 境界を枠で囲み「別世界」 を視覚化"
  - "locked と minted の 2 つ state を別宣言して「元 chain は残高減らず、 先 chain で新規 mint」 を伝える"
  - "lock → relay → mint の順序を 3 phase で時系列強制 (順序壊れると bridge 不成立)"
common_mistakes:
  - "relayer lane に contain を付ける ... 3 番目の chain に見えてしまう (relayer は中継経路、 枠なしが正解)"
  - "locked と minted を 1 state にまとめる ... 元 chain と先 chain で別資産が並走する事実が消える"
  - "1 phase に全動作を詰める ... lock → relay → mint の時間順序が読者に伝わらない"
  - "src / dst の contain を外す ... chain 境界が消えて「全部同じ世界」 に見える"
related_patterns:
  - "permit ... 同じ 3 lane + 3 phase 構成の off-chain 署名版"
  - "approve-pull ... 中央 lane を contain で囲み内部を縦並びにする近似構造"
```

## 確認

ブラウザで diagram を開いて、 以下が見えれば正しく動いています。

- src / dst の 2 lane に枠線 (contain) が表示される
- phase 1 (lock) で User → lock() → Vault に粒子が流れ、 Vault 内の `locked` が **0 から 10** へ動く
- phase 2 (relay) で粒子が中央 Bridge lane の Relayer を貫通して mint() に到達する
- phase 3 (mint) で Receiver の value が **0 から 10** へ動き、 「minted」 badge が出る

`locked` が動かない、 もしくは `minted` が動かない場合は、 phase ごとの `tween()` 呼び出しと state 宣言が一致しているか確認してください。

[preview:patterns/pattern-bridge]

## なぜこう書くか

Bridge の docs を読む人がまず躓くのは、 **「資産が物理的に動くのか、 それとも別 chain で新たに作られるのか」** という点です。
Lock-Mint 方式は後者で、 元 chain の資産は lock されたまま動かず、 先 chain で同量が新たに mint されます。
この事実を伝えるために、 cdl では state を 2 つ持つ構造を取ります。

設計のポイントは以下の 4 点です。

- **3 lane に分ける** ... source chain と destination chain は別世界なので、 中央に bridge lane を挟んで物理的に分離します
- **`contain: true` で chain 境界を囲む** ... src / dst の lane に枠を付けると「ここから先は別 chain」 と視覚的に伝わります
- **3 phase で順序を見せる** ... lock → relay → mint の順序が壊れると bridge は成立しないため、 phase 単位で時系列を明示します
- **state を 2 つ持つ** ... `locked` と `minted` を別 state にすると、 「元 chain の残高は減らず、 先 chain で新たに生まれた」 ことが残高表示の挙動から伝わります

relayer lane に `contain` を付けていないのは、 relayer は chain ではなく単なる中継経路だからです。
枠で囲んでしまうと「3 番目の chain」 のように見えてしまうので、 lane だけ立てて contain は外しています。

## 関連 docs

- [patterns 一覧](/docs/cdl/patterns/README) でほかの pattern を探せます
- [Permit](/docs/cdl/patterns/permit) も同じ 3 lane + 3 phase 構成で、 比較すると lane 使い分けの意図が分かります
- [Cookbook 7 番例](/docs/cdl/overview/cookbook) では CCTP (USDC 専用の burn-mint 経路) の完全実装を読めます
