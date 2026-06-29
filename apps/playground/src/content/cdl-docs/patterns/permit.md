# How to diagram an EIP-2612 Permit (gasless approval)

[preview:patterns/pattern-permit]

EIP-2612 (Permit) は ERC-20 の allowance を **off-chain 署名 1 回**で設定する規格です。
Owner が署名するだけなので **gas を一切払いません**。
Spender (relayer) が署名を on-chain に持ち込み、 `permit()` を呼んで allowance を確定させます。

このページでは、 その 3 step を cdl で 3 phase animation として書く手順を示します。

## 前提

このガイドは以下を前提に書かれています。

- cdl の [`diagram()` / `lane()` / `nodes()` / `edges()` / `phase()` API](/docs/cdl/primitives) を一通り読んでいること
- ERC-20 の `approve` と `transferFrom` の 2 step を知っていること
- EIP-712 (typed-data signing) の存在を知っていること、 詳細は不要です

mermaid の `sequenceDiagram` で書くと静止画 1 枚になりますが、 cdl では署名・relay・実行の 3 step を phase 単位で animate できます。

## 手順

3 つの lane を縦に立て、 そこに 5 つの node を配置し、 4 本の edge でつなぎます。
最後に sign / relay / execute の 3 phase を順に再生する設定を加えます。

以下の code をそのままコピーすれば、 完成形の diagram が手元で動きます。

::: tabs

@@@ humans 👤 For humans

```text
title: "EIP-2612 Permit (gasless)"
type: sequence

actors:
  - Owner
  - Spender
  - "EIP-712 typed-data": card
  - "permit(...sig)": function
  - allowances: storage

flow:
  - Owner -> "EIP-712 typed-data": "sign" (info, dotted-flow)
  - "EIP-712 typed-data" -> Spender: "send sig" (info, dotted-flow)
  - Spender -> "permit(...sig)": "permit(sig)" (accent, dotted-flow)
  - "permit(...sig)" -> allowances: "set allowance" (teal, dotted-flow)

states:
  allowance: 0

animation:
  - step: "Off-chain signature" 1.8s
    focus: [Owner, "EIP-712 typed-data"]
    badge: "signed"

  - step: "Spender が relay" 1.8s
    focus: ["EIP-712 typed-data", Spender]
    badge: "relayed"

  - step: "Spender が on-chain execute" 1.8s
    focus: [Spender, "permit(...sig)", allowances]
    tween:
      allowance: 0 -> 100
    badge: "approved"
```

@@@ llm 🤖 For LLM

```yaml
diagram: permit
topic: "EIP-2612 Permit (gasless)"
lanes:
  - { id: o, x: 0,    width: 320 }
  - { id: s, x: 540,  width: 360 }
  - { id: t, x: 1240, width: 420, contain: true }
state:
  - { id: allowance, initial: 0 }
nodes:
  - { id: owner,    lane: o, stack: 0, kind: actor,    title: "Owner",              subtitle: "署名のみ (gas 0)" }
  - { id: spender,  lane: s, stack: 0, kind: actor,    title: "Spender",            subtitle: "relayer" }
  - { id: eip712,   lane: s, stack: 1, kind: card,     title: "EIP-712 typed-data", subtitle: "domain + Permit struct" }
  - { id: permitFn, lane: t, stack: 0, kind: function, title: "permit(...sig)" }
  - { id: allowMap, lane: t, stack: 1, kind: storage,  title: "allowances",         rows: ["amt: {allowance}"] }
edges:
  - { from: owner,    to: eip712,   label: "sign",          tone: info,   style: dotted-flow }
  - { from: eip712,   to: spender,  label: "send sig",      tone: info,   style: dotted-flow }
  - { from: spender,  to: permitFn, label: "permit(sig)",   tone: accent, style: dotted-flow }
  - { from: permitFn, to: allowMap, label: "set allowance", tone: teal,   style: dotted-flow }
phases:
  - { id: sign,    duration: 1800, title: "Off-chain signature",     body: "Owner が EIP-712 typed-data で署名 (gas 不要)。", activate: [owner, eip712, owner-eip712], badge: "signed" }
  - { id: relay,   duration: 1800, title: "Spender が relay",         body: "Owner から sig を受け取って on-chain へ relay。", activate: [eip712, spender, eip712-spender], badge: "relayed" }
  - { id: execute, duration: 1800, title: "Spender が on-chain execute", body: "permit を呼んで allowance 設定。",            activate: [spender, permitFn, allowMap, spender-permitFn, permitFn-allowMap], tween: [{ state: allowance, from: 0, to: 100 }], badge: "approved" }
```

:::

上の code は、 Owner / Spender / Token contract の 3 役を別 lane に並べ、 sign → relay → execute の流れを 3 phase で時系列再生します。
`states.allowance` を 0 から 100 へ tween しているのは、 allowance が確定する瞬間を視覚化するためです。

v0.5 Text DSL では `lane` の `x` 座標 / `width` / `contain` (枠付き) や node の `stack` / `subtitle` / `rows` を制御できません。
それらを細かく宣言したい場合は、 下記 chain API を使ってください。

## API Reference (chain API)

v0.5 Text DSL は最小宣言に絞っており、 lane の物理位置 (`x` / `width` / `contain`)、 node の `stack` / `subtitle` / `rows`、 edge の `labelOffsetX` 等の細部は表現できません。
3 lane を物理位置で制御し、 Token contract 内に function と storage を縦並びにしたい場合は、 以下の chain API で宣言します。

```ts
import { diagram } from "@cardenelabs/cdl";

export const permit = diagram("permit", { topic: "EIP-2612 Permit (gasless)" })
  .lane("o", { x: 0,    width: 320 })
  .lane("s", { x: 540,  width: 360 })
  .lane("t", { x: 1240, width: 420, contain: true })
  .state("allowance", { initial: 0 })
  .nodes([
    { id: "owner",    lane: "o", stack: 0, kind: "actor",    title: "Owner",    subtitle: "署名のみ (gas 0)" },
    { id: "spender",  lane: "s", stack: 0, kind: "actor",    title: "Spender",  subtitle: "relayer" },
    { id: "eip712",   lane: "s", stack: 1, kind: "card",     title: "EIP-712 typed-data", subtitle: "domain + Permit struct" },
    { id: "permitFn", lane: "t", stack: 0, kind: "function", title: "permit(...sig)" },
    { id: "allowMap", lane: "t", stack: 1, kind: "storage",  title: "allowances", rows: ["amt: {allowance}"] },
  ])
  .edges([
    { from: "owner",    to: "eip712",   label: "sign",          tone: "info",    style: "dotted-flow" },
    { from: "eip712",   to: "spender",  label: "send sig",      tone: "info",    style: "dotted-flow" },
    { from: "spender",  to: "permitFn", label: "permit(sig)",   tone: "accent",  style: "dotted-flow" },
    { from: "permitFn", to: "allowMap", label: "set allowance", tone: "teal",    style: "dotted-flow" },
  ])
  .phase("sign", { duration: 1800, title: "Off-chain signature", body: "Owner が EIP-712 typed-data で署名 (gas 不要)。" },
    (p) => p.activate("owner", "eip712", "owner-eip712").badge("signed"))
  .phase("relay", { duration: 1800, title: "Spender が relay", body: "Owner から sig を受け取って on-chain へ relay。" },
    (p) => p.activate("eip712", "spender", "eip712-spender").badge("relayed"))
  .phase("execute", { duration: 1800, title: "Spender が on-chain execute", body: "permit を呼んで allowance 設定。" },
    (p) => p.activate("spender", "permitFn", "allowMap", "spender-permitFn", "permitFn-allowMap").tween("allowance", 0, 100).badge("approved"))
  .build();
```

## Pattern metadata (LLM 向け)

LLM が pattern を機械処理するための完全な declarative metadata です。

```yaml
pattern: permit
intent: "EIP-2612 gasless approval — Owner signs off-chain (gas 0), Spender relays the sig on-chain and calls permit() to set allowance"
lanes:
  - { id: o, role: "Owner (off-chain signer)", x: 0, width: 320 }
  - { id: s, role: "Spender (relayer, on-chain caller)", x: 540, width: 360 }
  - { id: t, role: "Token contract (ERC-20 with EIP-2612)", x: 1240, width: 420, contain: true }
state:
  - { id: allowance, initial: 0, purpose: "ERC-20 allowance set by permit()" }
nodes:
  - { id: owner,    lane: o, stack: 0, kind: actor,    title: "Owner",              purpose: "subject of approval, pays no gas" }
  - { id: spender,  lane: s, stack: 0, kind: actor,    title: "Spender",            purpose: "relayer that submits the on-chain tx" }
  - { id: eip712,   lane: s, stack: 1, kind: card,     title: "EIP-712 typed-data", purpose: "signed payload (domain + Permit struct)" }
  - { id: permitFn, lane: t, stack: 0, kind: function, title: "permit(...sig)",     purpose: "verifies sig, mutates allowance" }
  - { id: allowMap, lane: t, stack: 1, kind: storage,  title: "allowances",         purpose: "on-chain allowance map (key=spender)" }
edges:
  - { from: owner,    to: eip712,   label: "sign",          tone: info,   role: "off-chain signature creation" }
  - { from: eip712,   to: spender,  label: "send sig",      tone: info,   role: "sig handoff off-chain to relayer" }
  - { from: spender,  to: permitFn, label: "permit(sig)",   tone: accent, role: "on-chain call with sig payload" }
  - { from: permitFn, to: allowMap, label: "set allowance", tone: teal,   role: "verified sig writes allowance" }
phases:
  - { id: sign,    title: "Off-chain signature",     body: "Owner signs EIP-712 typed-data (no gas).", duration_ms: 1800, activates: [owner, eip712, owner-eip712], badge: "signed" }
  - { id: relay,   title: "Spender relays sig",      body: "Spender receives sig from Owner.",         duration_ms: 1800, activates: [eip712, spender, eip712-spender], badge: "relayed" }
  - { id: execute, title: "Spender executes on-chain", body: "Call permit() to set allowance.",        duration_ms: 1800, activates: [spender, permitFn, allowMap, spender-permitFn, permitFn-allowMap], tweens: [{ state: allowance, from: 0, to: 100 }], badge: "approved" }
critical_design_points:
  - "Owner / Spender / Token を 3 lane に分離して on-chain と off-chain の境界を左右位置で示す"
  - "EIP-712 typed-data を Owner subtitle に押し込めず独立 card node にして署名対象の実体を可視化"
  - "sign → relay → execute を 3 phase に分けて時系列を強制 (1 枚に詰めると順序が伝わらない)"
  - "allowance を 0 → 100 へ tween し permit() の結果として allowance 確定する瞬間を数値で示す"
common_mistakes:
  - "Owner と Spender を同 lane に置く ... gas を払うのが Spender だけという事実が消える"
  - "EIP-712 を Owner subtitle に格納 ... 署名対象が独立 object である事実が伝わらない"
  - "全 edge を solid line にする ... 4 本が静的に並んで時間の流れが伝わらない (dotted-flow 必須)"
  - "phase 3 で state tween を忘れる ... allowance 数値が動かず permit() の効果が見えない"
related_patterns:
  - "approve-pull ... 同じ allowance 設定を on-chain approve で実現する伝統 ERC-20 版 (gas が Owner)"
  - "bridge ... 同じ 3 lane + 3 phase 構成の cross-chain 版"
```

## 確認

ブラウザで diagram を開いて、 以下が見えれば正しく動いています。

- phase 1 (sign) で粒子が Owner から EIP-712 typed-data の card へ流れ、 「signed」 badge が出る
- phase 2 (relay) で粒子が card から Spender へ流れ、 「relayed」 badge が出る
- phase 3 (execute) で粒子が Spender → permit() → allowances へ流れ、 allowances 内の数値が **0 から 100** へ滑らかに増える

allowance の数値が固定のままなら、 phase 3 の `.tween("allowance", 0, 100)` が呼ばれていない可能性があります。
state を `state("allowance", { initial: 0 })` で宣言しているか確認してください。

[preview:patterns/pattern-permit]

## なぜこう書くか

この pattern の核心は、 **オンチェーン処理とオフチェーン処理を 1 枚の図で見せる**ことです。
EIP-2612 を読む人がまず迷うのは「誰が gas を払うのか」 と 「sig はどこで作られて、 どこで使われるのか」 の 2 点です。
cdl で書くと、 lane の分離と phase の時系列でこの 2 つを同時に解消できます。

設計上のポイントは 4 つあります。

- **3 lane に分離する** ... Owner (off-chain) と Spender (relayer) と Token contract を別 lane に置くことで、 どこが on-chain でどこが off-chain かを左右の位置だけで判別できます
- **EIP-712 を独立 node にする** ... typed-data を Owner の subtitle に押し込めず、 `kind: "card"` の独立 node として描くと、 「署名対象は別物として存在する」 という事実が伝わります
- **3 phase で時系列に分解する** ... sign → relay → execute を 1 枚にまとめると順序が伝わらないため、 phase で分けてアニメーションで再生します
- **allowance を tween で動かす** ... 数値が 0 から 100 へ動く瞬間を見せると、 「permit() の結果として allowance が確定する」 ことが直感的に分かります

すべての edge を `style: "dotted-flow"` にしているのは、 「sig や call が物理的に流れていく」 感を出すためです。
通常の実線にすると 4 本が静的に並んで見え、 時間の流れが伝わりにくくなります。

## 関連 docs

- [patterns 一覧](/docs/cdl/patterns/README) でほかの pattern を探せます
- [Bridge](/docs/cdl/patterns/bridge) は同じ 3 lane + 3 phase 構成の cross-chain 版です
- [Cookbook 5 番例](/docs/cdl/overview/cookbook) では permit を Proxy パターンと組み合わせる完全実装を読めます
