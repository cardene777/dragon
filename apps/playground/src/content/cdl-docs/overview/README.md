# overview ... cdl とは何か

`cdl` (Chainome Diagram Language、 アニメーション付き図表記述ライブラリ) を始める前に、 全体像を 1 ページで把握するためのセクションです。
あなたが図を書く前に、 「cdl が何を目指していて、 mermaid と何が違うのか」 をここで掴んでください。

## 何が cdl か

cdl は YAML 風の Text DSL (Domain-Specific Language、 用途特化言語) で書く図表記述ライブラリで、 静止画ではなくアニメーションする React コンポーネントを生成します。
あなたが `title:` / `type:` / `actors:` / `flow:` の 4 ブロックを宣言すると、 ライブラリが自動で配置 (layout) して動く図に変換します。
mermaid の `sequenceDiagram` を書く感覚に近いですが、 出力は SVG 文字列ではなく React コンポーネントです。

```text
title: "Hello"
type: sequence

actors:
  - User
  - API

flow:
  - User -> API: "request"
```

> 💡 **mermaid との関係** ... 競合ではなく補完です。 README に 1 行で軽い図を貼るなら mermaid、 docs サイト・教材で動く図を見せるなら cdl、 という棲み分けで運用します。

## どんな図が描けるか

cdl が想定する読者は、 おもに 6 種類の図を描きたい開発者です。
`type:` で 6 preset から選びます。

| preset | あなたが書く図 | 動く要素 |
|---|---|---|
| `sequence` | シーケンス図 (時系列のやりとり) | actor 間に粒子 (particle) が流れる |
| `flow` | 縦並びの単純フロー | next-step edge を自動接続 |
| `swimlane` | 役割別 lane (Sender / Contract / Receiver) | phase ごとに active 領域が遷移 |
| `er` | ER 図 (entity-relation) | 静的構造、 cardinality 表記 |
| `state` | 状態遷移図 (state machine) | initial / final + guard 条件 |
| `topology` | システム構成図 (上から俯瞰) | group 横断の connect |

29 種類の visual kind (`actor` / `function` / `storage` / `cloud` / ほか) を持ち、 mermaid より表現力が広い構成です。

## ドキュメントの読み進め方

このセクションには、 学習段階に合わせた 3 つの導入記事があります。

| ファイル | 種類 (Diátaxis) | 読むタイミング |
|---|---|---|
| [Quickstart](/docs/cdl/overview/quickstart) | Tutorial (実装入門) | はじめて cdl に触れるとき |
| [Cookbook](/docs/cdl/overview/cookbook) | How-to (実用例集 25 例) | 特定のパターンを書きたいとき |
| [Mermaid Migration](/docs/cdl/overview/mermaid-migration) | How-to (移行手順) | mermaid からの乗り換え時 |

> 💡 **Diátaxis 分類とは** ... ドキュメントを「Tutorial / How-to / Reference / Explanation」 の 4 種類に分けて書く方法論 (https://diataxis.fr/) です。 cdl docs もこの分類に沿って構成しています。

読了後は、 より深い設計概念に進めます。
[primitives](/docs/cdl/primitives/README) で `lane` / `node` / `edge` / `phase` の最小要素を理解し、 [presets](/docs/cdl/presets/README) で 6 preset の詳細を覚え、 [patterns](/docs/cdl/patterns/README) で 5 つの blockchain パターンに進む、 という順番をおすすめします。

## 次のステップ

最初に動く図を作りたいなら、 [Quickstart](/docs/cdl/overview/quickstart) で 5 step (各 5 分) の経路を実行できます。
書きたい図のイメージが具体的にあるなら、 [Cookbook](/docs/cdl/overview/cookbook) の 25 例 (DeFi / NFT / DAO / Bridge) を眺めると一番近いパターンを見つけられます。
