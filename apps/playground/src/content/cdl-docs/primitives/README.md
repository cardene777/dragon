# Primitives

このページは cdl の 5 つの基本パーツへの navigation hub です。
ここに並ぶ primitive (cdl の最小単位) だけ覚えれば、 任意の diagram を組み立てられます。
個別仕様は左サイドメニューまたは下表のリンクから参照してください。

## 5 つの primitive

cdl の diagram は、 次の 5 つの primitive を組み合わせて作ります。
それぞれが「列」 「要素」 「関連」 「変数」 「章」 という独立した責務を持ち、 他の primitive に依存しません。

| Primitive | 役割 | リンク |
|---|---|---|
| `lane` | 横方向の区画 (列)。 actor 群や system 境界を 1 つの列にまとめます | [lane.md](/docs/cdl/primitives/lane) |
| `node` | 個別パーツ。 actor / function / storage など 29 種の `kind` を選びます | [node.md](/docs/cdl/primitives/node) |
| `edge` | node 間の関連を矢印で表します | [edge.md](/docs/cdl/primitives/edge) |
| `state` | phase 進行で変化する変数。 数値補間や状態遷移を表現します | [state.md](/docs/cdl/primitives/state) |
| `phase` | 動作の章 (時系列の step)。 animation の核心です | [phase.md](/docs/cdl/primitives/phase) |

## 設計意図

> 💡 なぜ primitive を 5 つに絞ったか
> mermaid (テキストベースの diagram tool) や PlantUML が `sequenceDiagram` / `flowchart` / `stateDiagram` など figure type 単位で別 syntax を持つのに対し、 cdl はあらゆる図を 5 primitive の組合せで表現します。
> primitive を絞ることで、 1 度覚えれば全 diagram に転用でき、 学習コストを最小化できます。
> 高位の表現 (sequence / flowchart 等) は preset 層に分離し、 内部では同じ primitive で組み立てます。

## 学習順

cdl を初めて触る場合、 次の順で読むと無理なく書けるようになります。
各 primitive は前の primitive を組み合わせて使う構造のため、 上から順に学習してください。

1. `lane` で列を作ります
2. `node` で各列に要素を置きます
3. `edge` で要素間を矢印で繋ぎます
4. `phase` で動作の章を分けます (animation の核心)
5. `state` で phase ごとに数値を遷移させます (動的表現)

## 関連

- [presets](/docs/cdl/presets/README) ... 上記 primitive を組み合わせた高位 API です
- [Quickstart](/docs/cdl/overview/quickstart) ... 最小コードを 5 分で動かします
- [Catalog page](/catalog/primitives) ... 動作見本 39 種をブラウザで確認できます
