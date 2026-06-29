# Verifier Guide (「目」 の使い方)

cdl の自動検証機構 (「目」) を実際に走らせて、 diagram の品質を保つための **How-to + Explanation** ガイドです。
前半 (How-to) では 3 経路の verifier の動かし方を、 後半 (Explanation) では「なぜこの仕組みが必要か」 を説明します。

> このページは **How-to + Explanation** の混在型です。
> 「すぐ動かしたい」 場合は § 使い方 (How-to) から、
> 「なぜこの設計か」 を理解したい場合は § なぜ verifier が必要か (Explanation) から読んでください。
> 関数 signature は [API Reference](/docs/cdl/reference/api) を参照してください。

## TOC

長めの page なので、 目次から該当 section に飛んでください。

- [How-to ... 3 経路の使い方](#how-to--3-経路の使い方)
  - [前提条件](#前提条件)
  - [手順 1 ... 静的検証 (`validate:diagrams`)](#手順-1--静的検証-validatediagrams)
  - [手順 2 ... DOM 整合検証 (`verify:dom`)](#手順-2--dom-整合検証-verifydom)
  - [手順 3 ... 作者意図検証 (`verify:intent`)](#手順-3--作者意図検証-verifyintent)
  - [部分実行と CI 連携](#部分実行と-ci-連携)
  - [厳格 mode](#厳格-mode)
  - [vitest からの呼び出し](#vitest-からの呼び出し)
- [Explanation ... なぜ verifier が必要か](#explanation--なぜ-verifier-が必要か)
  - [3 経路の役割分担](#3-経路の役割分担)
  - [各経路の検知範囲](#各経路の検知範囲)
  - [検知例](#検知例)
  - [tolerance 設計の考え方](#tolerance-設計の考え方)
- [関連](#関連)

---

## How-to ... 3 経路の使い方

ここでは「とにかく動かす」 側の手順だけを示します。
背景や設計意図は後半の Explanation section にまとめています。

### 前提条件

verifier を回す前に、 以下を満たしてください。
特に dev server は `verify:dom` / `verify:intent` の前提です。

- `pnpm install` 済み
- `pnpm dev` で dev server (default `http://localhost:4321`) を起動できる
- Playwright が install 済み (`pnpm exec playwright install` 1 回必要)

`validate:diagrams` のみ dev server なしで動きます。
local 開発中の即時 feedback には、 まず `validate:diagrams` を回してください。

### 手順 1 ... 静的検証 (`validate:diagrams`)

dev server なしで動く、 最軽量の静的レイアウト検証です。
cdl を編集している最中の即時 feedback に使います。

```bash
pnpm validate:diagrams
```

このコマンドは declaration だけを読んで AABB / clearance / alignment を検査します。
画面 render は不要なので、 1 秒未満で結果が返ります。

### 手順 2 ... DOM 整合検証 (`verify:dom`)

engine の自己整合 (cdl 値 ↔ DOM attribute) を検査します。
engine 改修時の regression 検知に使います。

別 terminal で dev server を起動してから、 以下を実行してください。

```bash
# 1. 別 terminal で dev server 起動
pnpm dev

# 2. DOM 整合検証
pnpm verify:dom
```

verify:dom は Playwright で実画面を取得し、 `data-cdl-cx` / `data-cdl-cy` 等の attribute を layout 計算値と照合します。
全 catalog page を巡回するため、 全件で数十秒かかります。

### 手順 3 ... 作者意図検証 (`verify:intent`)

cdl の中で書いた意図 (title / label / activate / tone 等) が、 実画面に **そのとおりに出ているか** を検査します。
mermaid 的な「書いたとおりに描画されているか」 の本質チェックです。

dev server を起動した状態で実行してください。

```bash
pnpm verify:intent
```

verify:intent は SVG `<text>` / `<path>` の visible 状態を直接読み、 cdl の declaration と照合します。
engine bug の発見力が最も高い経路です。

### 部分実行と CI 連携

全件回すと時間がかかるため、 module 単位 / 機械処理用の出力 / baseline gate を用意しています。
状況に合わせて flag を渡してください。

```bash
# 特定 module だけ
pnpm verify:intent -- --module patterns

# JSON 出力 (CI / 機械処理)
pnpm verify:intent -- --json > result.json

# baseline gate (既存 fail 数だけ許容、 regression のみ block)
pnpm verify:intent -- --max-fail 10
```

`--max-fail` を渡すと、 既知の fail 数までは pass 扱いになります。
regression (= 増加分) だけを止めたい CI gate に有効です。

### 厳格 mode

default の tolerance は「視覚的に明らかな乖離」 を捉える緩い設定です。
engine 内部の細かい誤差まで掘りたい場合は `--strict` を渡します。

```bash
# default は user 視覚で許容できる tolerance、 strict は engine bug hunting
pnpm verify:intent -- --strict   # lane 24px / edge 40px tolerance
pnpm verify:dom    -- --strict   # particle 30px / bbox 4px tolerance
```

`--strict` 下では tolerance が大幅に厳しくなるため、 通常 OK な diagram でも fail することがあります。
日常運用は default、 engine 改修時のみ `--strict` という二刀流を推奨します。

### vitest からの呼び出し

verifier 関数群は npm package としても export しているため、 vitest に組み込めます。
PR 単位で特定 diagram の regression を防ぎたい場合に便利です。

```ts
// packages/cdl/test/intent.test.ts
import { verifyAuthorIntent } from "@cardenelabs/cdl";

test("login flow が宣言通り表示される", async () => {
  await page.goto("http://localhost:4321/login");
  const discs = await verifyAuthorIntent(asPageLike(page), loginDiagram);
  expect(discs).toHaveLength(0);
});
```

`verifyAuthorIntent` は不一致点 (discrepancy) を配列で返します。
`toHaveLength(0)` で「不一致が 0 件」 を assertion にできます。

[preview:animation/tween-simple]

---

## Explanation ... なぜ verifier が必要か

ここからは、 上の 3 経路がなぜ存在するか、 どう設計されているかを説明します。

mermaid のような他の diagram tool は、 「書いたテキストが画面に正しく出ているか」 を engine 側で検査する仕組みを持ちません。
そのため、 engine の bug や layout 計算の drift が起きても、 著者が目視するまで気付けません。
cdl はこの問題を **engine 側で自動検証する** ことで解決しています。

### 3 経路の役割分担

3 つの verifier は、 検証対象と LLM 課金の有無で住み分けています。
どれも LLM を使わないため、 課金ゼロで運用できます。

| Verifier | 検証対象 | LLM | 課金 |
|---|---|---|---|
| `pnpm validate:diagrams` | 静的 layout (AABB / clearance) | 不要 | 0 |
| `pnpm verify:dom` | engine 自己整合 (cdl 値 ↔ DOM attribute) | 不要 | 0 |
| `pnpm verify:intent` | **作者意図 ↔ 実画面** (mermaid 的本質) | 不要 | 0 |

3 経路は段階的に重さが上がります。
`validate:diagrams` を即時、 `verify:dom` を PR 単位、 `verify:intent` を release gate という運用も可能です。

### 各経路の検知範囲

それぞれの verifier が、 何をどのように検査しているかを軸ごとに整理します。
全体を 1 経路で済ませる設計にしなかった理由は、 検証コストと粒度のトレードオフを段階化するためです。

#### validate:diagrams (静的判定、 6 軸)

dev server なしで動く軽量チェックです。
cdl 修正中の即時 feedback 用に設計しています。

- node-visibility ... bbox 面積 80x40 以上
- edge-label-overlap ... AABB collision
- text-readability ... font size / contrast
- row-format ... storage rows の `key: value` parse
- alignment ... 同 lane 内 cx 一致
- clearance ... clearance policy 違反

ここで失敗した場合は、 まず declaration 自体の構造が壊れています。
declaration を直してから先の経路に進んでください。

#### verify:dom (engine 自己整合、 5 種類)

dev server で render した SVG の DOM attribute を直接読み、 cdl の値と照合します。
engine 改修時の regression 検知に最も効きます。

- node 位置 ... `data-cdl-cx` / `data-cdl-cy` が layout 計算値と一致
- edge path 起点終点 ... `from` / `to` node 側面に乗っている
- edge label 位置 ... `labelX` / `labelY` が一致
- bbox 照合 ... 実 SVG viewport 位置 ↔ SVG userspace
- particle 位置 ... animation 中の particle が path 上
- activation ... active class set が phase.activate と一致

`verify:dom` で fail する場合は、 engine の render layer か layout 層の bug が疑われます。
declaration を変えずに engine を直す pull request を切ってください。

#### verify:intent (作者意図 ↔ 実画面、 6 軸 ... 最重要)

mermaid 的に「人が `.node("user", { title: "User" })` と書いた時、 画面に `User` という文字が出ているか」 を直接確認します。
declaration と画面のあいだの整合を検査する、 cdl 独自の経路です。

- **node-in-lane** ... `contain: true` の lane で node が領域内
- **node-text-visible** ... `node.title` / `subtitle` / `eyebrow` が SVG `<text>` に visible
- **edge-label-visible** ... `edge.label` / `sub` が SVG `<text>` に visible
- **edge-connected** ... edge path 起点 / 終点が `from` / `to` node の近く
- **activation-visible** ... `.activate()` 宣言要素が画面で active 強調
- **tone-color** ... `edge.tone` の指定色が SVG stroke に反映 (RGB 距離判定)

ここでの fail は「著者の意図と画面のずれ」 を意味します。
declaration を見直すか、 engine 側の render layer を修正してください。

### 検知例

実際に verifier が出すエラーの読み方を、 2 例で示します。
出力は `[diagram-id] axis-name (element=対象 id)` の形式で並びます。

#### `pnpm verify:intent` が捉える bug ... 1

`node-title-missing` は、 declaration に `title` が書かれているのに SVG `<text>` で visible でない、 という意味です。
engine の render layer で title が描画されていない bug を意味します。

```
[seq-demo] node-title-missing (element=user)
  node "user" の title "User" が SVG <text> に visible でない
```

cdl 著者は意図通り `title: "User"` と書いたのに画面に出ていないため、 本物の engine bug です。
declaration を変えずに、 packages/cdl/src/render/ 配下を修正してください。

#### `pnpm verify:intent` が捉える bug ... 2

`activation-not-visible` は、 `.activate("user-order")` と宣言した要素が画面で active 強調されていない、 という意味です。
phase activation の伝播が壊れている可能性が高いです。

```
[er-demo] activation-not-visible (element=user-order)
  phase "p1" で .activate("user-order") 宣言されているが、 画面上で active 強調 (data-cdl-active=true) されていない
```

cdl 著者の `phase` 宣言が effective に効いていないため、 phase ロジックを再点検してください。
よくある原因は、 `activate` の id を typo しているか、 engine 側で activate 伝播が止まっている、 のどちらかです。

### tolerance 設計の考え方

verify 経路には default と `--strict` の 2 つの tolerance プリセットを用意しています。
日常運用と engine 改修中で「どこまで厳しく見るか」 を切り替えるためです。

| 経路 | tolerance | 検知範囲 |
|---|---|---|
| default | 緩い (lane 500px, edge 80px, etc) | 実画面で視覚的に明らかな乖離のみ |
| `--strict` | 厳格 (lane 24px, edge 40px, etc) | engine 内部の細かい誤差まで |

CI gate は default で「実害がある drift だけ止める」、
engine 改修中は `--strict` で「微細な drift も拾う」、 という二刀流を推奨します。
全て `--strict` 運用にすると false positive が増えて疲弊するため、 通常 default のままで構いません。

---

## 関連

ここからの次の docs を案内します。
状況に合わせて参照してください。

- [Quickstart](/docs/cdl/overview/quickstart) ... 5 分で動かしたい場合
- [API Reference](/docs/cdl/reference/api) ... 関数 signature を引きたい場合
- 内部実装 ... `packages/cdl/src/author-intent-verify.ts` / `dom-verify.ts` / `visual-validate.ts`
