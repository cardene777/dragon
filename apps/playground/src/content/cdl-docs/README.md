# `@cardenelabs/cdl` Documentation

`@cardenelabs/cdl` は、 宣言的に animated React + SVG diagram を書ける TypeScript DSL です。
mermaid のような「テキスト → 図」 体験に、 animation (phase / tween / particle / state) を加えた library として設計しています。

> このページは docs 全体の **Explanation + index** です。
> cdl の思想と全体構成をここで掴んでから、 各 section に進んでください。
> 「すぐ動かしたい」 場合は [Quickstart](/docs/cdl/overview/quickstart) に直接飛んでも構いません。

## TOC

長めの index なので、 目次から該当 section に飛んでください。

- [なぜ cdl があるか](#なぜ-cdl-があるか)
- [4 階層構成](#4-階層構成)
- [学習経路](#学習経路)
- [一目で見る完全例](#一目で見る完全例)
- [主な特徴](#主な特徴)
- [Text DSL ... 「コードを書きたくない人」 向け](#text-dsl--コードを書きたくない人-向け)
- [「目」 (visual quality gates)](#目-visual-quality-gates)
- [カタログ](#カタログ)

## なぜ cdl があるか

mermaid のような既存 diagram tool は、 static 表現には強いものの、 時系列 animation や state 変化を表現できません。
cdl は「mermaid と同じ親しみやすさで、 animation も書ける」 ことを目指して設計しました。

加えて、 cdl は他の diagram tool には無い **「目」 (作者意図 ↔ 実画面の自動検証)** を engine 側に持っています。
これによって engine bug や layout drift を、 著者の目視に頼らず検出できます。
詳しい設計意図は [Verifier Guide](/docs/cdl/reference/verifier-guide) の Explanation section にまとめています。

## 4 階層構成

docs は読者のレベルと用途に合わせて、 4 階層に分かれています。
下の表の順に読むと、 学習コストを最小化できます。

| 階層 | 内容 | 対象読者 |
|---|---|---|
| [overview](/docs/cdl/overview/README) | Quickstart / Cookbook / Mermaid Migration | 初心者 / mermaid 経験者 |
| [primitives](/docs/cdl/primitives/README) | lane / node / edge / state / phase の 5 基本パーツ | cdl を一から覚える人 |
| [presets](/docs/cdl/presets/README) | swimlane / flow / sequence / topology / er / stateMachine の 6 高位 API | 「mermaid みたいに 1 行で書きたい」 人 |
| [patterns](/docs/cdl/patterns/README) | Permit / Bridge / DEX / Multicall / Approve-Pull 等 18 実用 pattern | blockchain / Web2 の具体例を見たい人 |
| [reference](/docs/cdl/reference/README) | API 一覧 / Verifier Guide | 全 API を網羅したい人 |

各階層は独立に読めるよう設計していますが、 初学者は overview → primitives → presets の順を推奨します。

## 学習経路

docs を順番に読む場合の推奨経路を示します。
1 経路 5-15 分で次に進めるよう、 各 section の分量を抑えています。

```
overview/quickstart  (5 分で動かす)
        ↓
primitives/  (5 基本パーツを理解)
        ↓
presets/  (高位 API で 1 行宣言)
        ↓
patterns/  (実用 pattern を真似る)
        ↓
reference/  (全 API + verifier)
```

途中で動かなくなった場合は、 1 つ前の section に戻ってサンプルを再実行してください。
全 section に「ここまでで動くはず」 の確認ポイントを置いています。

## 一目で見る完全例

cdl がどのようなコードで書けるかを、 1 つの payment flow で示します。
以下の TypeScript を `pnpm dev` 起動後の page で実行すると、 そのまま animated diagram が表示されます。

```ts
import { diagram } from "@cardenelabs/cdl";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const payment = diagram("payment", { topic: "Payment Flow" })
  .lane("u", { x: 0, width: 320 })
  .lane("api", { x: 460, width: 380 })
  .nodes([
    { id: "user", lane: "u", stack: 0, kind: "actor", title: "User" },
    { id: "pay", lane: "api", stack: 0, kind: "function", title: "POST /pay" },
  ])
  .edges([
    { from: "user", to: "pay", label: "submit" },
    { from: "pay", to: "user", label: "200 OK", tone: "success" },
  ])
  .phase("submit", { duration: 1800, title: "submit", body: "User が payment 情報を送る。" },
    (p) => p.activate("user", "pay", "user-pay"))
  .phase("respond", { duration: 1500, title: "respond", body: "サーバが OK を返す。" },
    (p) => p.activate("pay", "user", "pay-user"))
  .build();

export const App = () => <CdlDiagramView diagram={payment} />;
```

`diagram()` の chain で declaration を組み、 `.build()` で immutable な `CdlDiagram` を得ます。
React 側では `<CdlDiagramView diagram={...} />` に渡すだけで、 phase 順に animation が再生されます。

[preview:presets/seq-demo]

## 主な特徴

cdl が提供する主な features を、 関連 docs への link 付きで整理します。
詳細は各 link 先を参照してください。

| 特徴 | 説明 |
|---|---|
| **Text DSL (v0.1)** | 箇条書きで書ける、 非エンジニア / LLM 両対応 ... [text-dsl-spec.md](/docs/cdl/text-dsl-spec) |
| **TypeScript 完全型付け** | builder API が型 hint で auto complete |
| **animated by default** | phase / tween / progress glow が自動 |
| **6 preset (mermaid 同等)** | [presets/](/docs/cdl/presets/README) |
| **29 NodeKind** | [primitives/node.md](/docs/cdl/primitives/node) |
| **6 Tone** | [primitives/edge.md](/docs/cdl/primitives/edge) |
| **「目」 = visual verifier** | [reference/verifier-guide.md](/docs/cdl/reference/verifier-guide) |
| **layout 自動** | lane / stack 配置 / edge routing / particle 全部 auto |

mermaid 経験者は「mermaid に近いけど animation できる」 と捉えると馴染みやすいです。
新規ユーザーは Text DSL から入る経路も用意しています。

## Text DSL ... 「コードを書きたくない人」 向け

builder API を書くのが難しい場合は、 箇条書きベースの Text DSL を使えます。
以下のような自然言語に近い記法で、 builder API と等価な diagram を生成できます。

```cdl
タイトル: Login
種類: sequence

登場人物:
  - User
  - API (function)

流れ:
  1. User → API: POST /login
  2. API → User: 200 OK (成功)
```

これを `textDslToDiagram()` に渡すだけで、 上の builder API と等価な `CdlDiagram` を得られます。
非エンジニアや LLM (ChatGPT / Claude / Cursor 等) でも書ける文法として設計しました。

[preview:presets/seq-demo]

詳細は [Text DSL Spec](/docs/cdl/text-dsl-spec) と [LLM 生成ガイド](/docs/cdl/text-dsl-llm-guide) を参照してください。

## 「目」 (visual quality gates)

cdl は他の diagram tool には無い、 **作者意図と実画面の一致を engine 側で自動検証する仕組み** を備えています。
3 経路 (静的 / DOM 整合 / 意図照合) を段階的に走らせて、 declaration と画面の drift を検出します。

```bash
pnpm validate:diagrams      # 静的 layout 衝突判定
pnpm verify:dom             # render DOM 整合性 (engine 自己整合)
pnpm verify:intent          # 作者意図 ↔ 実画面 (mermaid 的本質)
```

3 経路の使い分け / tolerance 設計 / 実例は [Verifier Guide](/docs/cdl/reference/verifier-guide) を参照してください。
日常運用では `validate:diagrams` だけで十分速いため、 まずそこから試すと良いです。

## カタログ

各 primitive / preset / pattern の動作見本は、 web 上の catalog page で確認できます。
docs を読むよりも、 まず visual に確認したい場合はこちらを開いてください。

| Page | 内容 |
|---|---|
| `/catalog/primitives` | 39 primitive (5 基本 + 29 NodeKind + 等) |
| `/catalog/styles` | 10 tone / edge style 見本 |
| `/catalog/animation` | 5 animation pattern |
| `/catalog/patterns` | 18 blockchain pattern |
| `/catalog/presets` | 6 preset 完成例 |

catalog page の各 diagram には、 元の cdl declaration へのリンクも付いています。
気に入った例があれば、 declaration をコピーして自プロジェクトに持ち込めます。
