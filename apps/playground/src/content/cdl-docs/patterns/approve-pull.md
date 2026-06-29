# How to diagram an ERC-20 Approve → Pull (2-step transfer)

[preview:patterns/pattern-approve-pull]

ERC-20 で他人に資産を渡してもらうには、 **2 step transfer** が必要です。
Owner が `approve(spender, n)` で allowance (引き出し可能額) を設定し、 Spender が `transferFrom(owner, ...)` で pull します。
push 型でなく pull 型なので、 Owner は資産を動かさず「許可」 だけを与えます。

このページでは、 Owner / Token contract / Spender の 3 lane に分け、 approve → pull の 2 phase で allowance の増減を可視化する手順を示します。

## 前提

このガイドは以下を前提に書かれています。

- cdl の [`diagram()` / `lane()` / `state()` / `phase()` API](/docs/cdl/primitives) を一通り読んでいること
- ERC-20 の `approve` / `transferFrom` / `allowance` の 3 関数を知っていること
- gas を Owner が払うこと (push 型と違って Spender が pull するときも、 そのときの gas は Spender が払うこと) を理解していること

mermaid の `sequenceDiagram` でも 2 step は書けますが、 **allowance の数値が approve で増えて pull で減る**動きは表現できません。
cdl の `state("allowance")` + `tween` で、 数値の増減を直接動かして見せます。

## 手順

3 つの lane を立て (owner / token / spender)、 中央の Token lane に approveFn / allowMap / pullFn を stack 0 / 1 / 2 で縦並びにします。
state は `allowance` 1 つを宣言し、 approve phase で 0 → 100、 pull phase で 100 → 60 に動かします。

以下の code をそのままコピーすれば、 完成形が動きます。

::: tabs

@@@ humans 👤 For humans

```text
title: "Approve -> Pull (2 step)"
type: swimlane

actors:
  - Owner
  - "approve(spender, n)": function
  - allowances: storage
  - "transferFrom(...)": function
  - Spender

flow:
  - Owner -> "approve(spender, n)": "approve" (dotted-flow)
  - "approve(spender, n)" -> allowances: "set" (teal, dotted-flow)
  - Spender -> "transferFrom(...)": "transferFrom" (warning, dotted-flow)
  - "transferFrom(...)" -> allowances: "decrement" (warning, dotted-flow)

states:
  allowance: 0

animation:
  - step: "Owner: approve" 1.8s
    focus: [Owner, "approve(spender, n)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"

  - step: "Spender: transferFrom" 1.8s
    focus: [Spender, "transferFrom(...)", allowances]
    tween:
      allowance: 100 -> 60
    badge: "pulled"
```

@@@ llm 🤖 For LLM

```yaml
diagram: approve-pull
topic: "Approve → Pull (2 step)"
lanes:
  - { id: owner,   x: 0,    width: 280 }
  - { id: token,   x: 500,  width: 420 }
  - { id: spender, x: 1280, width: 280 }
state:
  - { id: allowance, initial: 0 }
nodes:
  - { id: o,         lane: owner,   stack: 0, kind: actor,    title: "Owner" }
  - { id: approveFn, lane: token,   stack: 0, kind: function, title: "approve(spender, n)" }
  - { id: allowMap,  lane: token,   stack: 1, kind: storage,  title: "allowances",        rows: ["sp: {allowance}"] }
  - { id: pullFn,    lane: token,   stack: 2, kind: function, title: "transferFrom(...)" }
  - { id: s,         lane: spender, stack: 0, kind: actor,    title: "Spender" }
edges:
  - { from: o,         to: approveFn, label: "approve",      style: dotted-flow }
  - { from: approveFn, to: allowMap,  label: "set",          tone: teal,    style: dotted-flow }
  - { from: s,         to: pullFn,    label: "transferFrom", tone: warning, style: dotted-flow }
  - { from: pullFn,    to: allowMap,  label: "decrement",    tone: warning, style: dotted-flow, labelOffsetX: 160 }
phases:
  - { id: approve, duration: 1800, title: "Owner: approve",         body: "Owner が Spender に対する allowance を設定。",        activate: [o, approveFn, allowMap, o-approveFn, approveFn-allowMap], tween: [{ state: allowance, from: 0,   to: 100 }], badge: "approved" }
  - { id: pull,    duration: 1800, title: "Spender: transferFrom",  body: "Spender が allowance の範囲で資産を pull、 allowance が減算。", activate: [s, pullFn, allowMap, s-pullFn, pullFn-allowMap], tween: [{ state: allowance, from: 100, to: 60 }],  badge: "pulled" }
```

:::

上の code は、 Owner と Spender が同じ Token contract の別関数 (`approve` / `transferFrom`) を別 phase で叩く様子を表現します。
allowance map (`allowances`) は両 phase で touch されるので、 中央位置に置くと両 phase の動きが自然に集約します。

v0.5 Text DSL では `lane.x` / `lane.width` (中央 Token lane を広くする) / `node.stack` (Token 内 3 要素の縦並び) / `node.rows` (allowance 数値表示) / `edge.labelOffsetX` (decrement label の右逃がし) を制御できません。
中央 lane を広くして縦 stack を整列したい場合や、 label の位置調整が必要な場合は下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL では lane の物理 layout (`x` / `width`)、 同 lane 内の `stack` 縦並び、 `node.rows` の数値補間表示、 `edge.labelOffsetX` の label 位置調整を表現できないので、 Token contract 内の縦並び表現が必要な場合は以下の chain API で宣言します。

```ts
import { diagram } from "@cardenelabs/cdl";

export const approvePull = diagram("approve-pull", { topic: "Approve → Pull (2 step)" })
  .lane("owner",   { x: 0,    width: 280 })
  .lane("token",   { x: 500,  width: 420 })
  .lane("spender", { x: 1280, width: 280 })
  .state("allowance", { initial: 0 })
  .nodes([
    { id: "o",         lane: "owner",   stack: 0, kind: "actor",    title: "Owner" },
    { id: "approveFn", lane: "token",   stack: 0, kind: "function", title: "approve(spender, n)" },
    { id: "allowMap",  lane: "token",   stack: 1, kind: "storage",  title: "allowances", rows: ["sp: {allowance}"] },
    { id: "pullFn",    lane: "token",   stack: 2, kind: "function", title: "transferFrom(...)" },
    { id: "s",         lane: "spender", stack: 0, kind: "actor",    title: "Spender" },
  ])
  .edges([
    { from: "o",         to: "approveFn", label: "approve",      style: "dotted-flow" },
    { from: "approveFn", to: "allowMap",  label: "set",          tone: "teal", style: "dotted-flow" },
    { from: "s",         to: "pullFn",    label: "transferFrom", tone: "warning", style: "dotted-flow" },
    { from: "pullFn",    to: "allowMap",  label: "decrement",    tone: "warning", style: "dotted-flow", labelOffsetX: 160 },
  ])
  .phase("approve", { duration: 1800, title: "Owner: approve", body: "Owner が Spender に対する allowance を設定。" },
    (p) => p.activate("o", "approveFn", "allowMap", "o-approveFn", "approveFn-allowMap").tween("allowance", 0, 100).badge("approved"))
  .phase("pull",    { duration: 1800, title: "Spender: transferFrom", body: "Spender が allowance の範囲で資産を pull、 allowance が減算。" },
    (p) => p.activate("s", "pullFn", "allowMap", "s-pullFn", "pullFn-allowMap").tween("allowance", 100, 60).badge("pulled"))
  .build();
```

## Pattern metadata (LLM 向け)

LLM が pattern を機械処理するための完全な declarative metadata です。

```yaml
pattern: approve-pull
intent: "ERC-20 2-step transfer — Owner approves allowance (phase 1), Spender pulls via transferFrom and decrements allowance (phase 2)"
lanes:
  - { id: owner,   role: "Owner (asset holder, sets allowance)",                x: 0,    width: 280 }
  - { id: token,   role: "Token contract (ERC-20, holds approve/transferFrom)", x: 500,  width: 420 }
  - { id: spender, role: "Spender (third party that pulls asset)",              x: 1280, width: 280 }
state:
  - { id: allowance, initial: 0, purpose: "allowance[owner][spender] in ERC-20 storage" }
nodes:
  - { id: o,         lane: owner,   stack: 0, kind: actor,    title: "Owner",                 purpose: "subject of approve, pays gas on approve" }
  - { id: approveFn, lane: token,   stack: 0, kind: function, title: "approve(spender, n)",   purpose: "sets allowance[caller][spender] = n" }
  - { id: allowMap,  lane: token,   stack: 1, kind: storage,  title: "allowances",            purpose: "on-chain allowance map, mutated by both phases" }
  - { id: pullFn,    lane: token,   stack: 2, kind: function, title: "transferFrom(...)",     purpose: "spender-called, decrements allowance and moves asset" }
  - { id: s,         lane: spender, stack: 0, kind: actor,    title: "Spender",               purpose: "third party that pulls, pays gas on pull" }
edges:
  - { from: o,         to: approveFn, label: "approve",      tone: default, role: "Owner invokes approve" }
  - { from: approveFn, to: allowMap,  label: "set",          tone: teal,    role: "approve writes allowance value" }
  - { from: s,         to: pullFn,    label: "transferFrom", tone: warning, role: "Spender invokes transferFrom" }
  - { from: pullFn,    to: allowMap,  label: "decrement",    tone: warning, role: "transferFrom subtracts from allowance", labelOffsetX: 160 }
phases:
  - { id: approve, title: "Owner: approve",         body: "Owner sets allowance for Spender.",                                duration_ms: 1800, activates: [o, approveFn, allowMap, o-approveFn, approveFn-allowMap], tweens: [{ state: allowance, from: 0, to: 100 }], badge: "approved" }
  - { id: pull,    title: "Spender: transferFrom",  body: "Spender pulls asset within allowance, allowance is decremented.", duration_ms: 1800, activates: [s, pullFn, allowMap, s-pullFn, pullFn-allowMap], tweens: [{ state: allowance, from: 100, to: 60 }], badge: "pulled" }
critical_design_points:
  - "Owner / Token / Spender を 3 lane に分離し中央 Token lane を広めに取って 3 内部要素を縦並びに配置"
  - "stack 0 / 1 / 2 を中央 lane に集める ... approveFn / allowMap / pullFn 縦並びで「set → decrement」 の上下流れを視覚化"
  - "labelOffsetX: 160 で pullFn → allowMap label を右に逃がし他 edge label との path 上交差を回避"
  - "allowance を 0 → 100 → 60 と動かし「approve で許可増、 transferFrom で許可消費」 を残数推移で示す"
common_mistakes:
  - "approveFn と pullFn を同 stack にまとめる ... 「同じ関数を 2 回呼んでいる」 と誤読される"
  - "allowMap を端の stack に置く ... 両 phase で touch される事実が視覚的に集約しない (中央 stack 1 が正解)"
  - "phase 2 の tween 起点を 0 にする ... approve phase の 100 を引き継がず allowance 増減の連続性が断たれる"
  - "labelOffsetX 省略 ... 「decrement」 label が他 edge label と path 上で重なって読めない"
related_patterns:
  - "permit ... 同じ allowance 設定を gas 0 (off-chain 署名) で実現する EIP-2612 版"
  - "dex-swap ... 同じ contain による contract 内部表現の構造"
```

## 確認

ブラウザで diagram を開いて、 以下が見えれば正しく動いています。

- 3 lane が左から Owner / Token / Spender の順に並ぶ
- 中央の Token lane に approve / allowMap / transferFrom が縦並びになる
- phase 1 (approve) で Owner → approve → allowances の経路に粒子が流れ、 allowances 内の数値が **0 → 100**
- phase 2 (pull) で Spender → transferFrom → allowances の経路に粒子が流れ、 数値が **100 → 60** へ減算

「decrement」 label が他 edge と重なる場合は、 `labelOffsetX: 160` の値が小さすぎる可能性があります。
今回は path から右に 160 px ずらしています。

[preview:patterns/pattern-approve-pull]

## なぜこう書くか

ERC-20 の docs を読む人が躓くポイントは、 **「push でなく pull なのはなぜか」** です。
push 型 (`transfer`) と違い、 `transferFrom` は **第三者 (Spender)** が呼ぶので、 contract に資産の出入りを任せたいときに必須です。
許可 (approve) と引き抜き (transferFrom) を別 step に分けることで、 Owner はその場で gas を払わず、 Spender も必要なときだけ引き抜けます。

設計のポイントは以下の 4 点です。

- **3 lane に分ける** ... Owner / Token / Spender を別 lane に置き、 中央の Token lane を広めに取って 3 つの内部要素を縦並びにします
- **stack 0 / 1 / 2 を中央 lane に集める** ... approveFn / allowMap / pullFn を縦に並べると、 「approve から allowance が set され、 transferFrom で allowance が decrement する」 という上下の流れが直感的に見えます
- **`labelOffsetX: 160` で label を右に逃がす** ... `pullFn → allowMap` の label は他 edge の label と path 上で交差するため、 水平方向に 160 px 動かして衝突を避けます
- **allowance を 0 → 100 → 60 と動かす** ... 数値が増えて減る過程を `tween` で連続的に見せると、 「approve で許可を増やし、 transferFrom で許可を消費する」 ことが残数の動きだけで伝わります

approveFn と pullFn を別 stack に分けているのは、 同じ contract 内でも別関数だからです。
1 つにまとめて描くと、 「同じ関数を 2 回呼んでいる」 ように誤読される可能性があります。

## 関連 docs

- [patterns 一覧](/docs/cdl/patterns/README) でほかの pattern を探せます
- [Permit](/docs/cdl/patterns/permit) は同じ allowance 設定を **gas 0 (off-chain 署名)** で実現する EIP-2612 版です
