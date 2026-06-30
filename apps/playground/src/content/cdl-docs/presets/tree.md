# tree preset

`tree` preset は parent-child (親子) の階層構造を depth (深さ) 別の lane で配置する高位 API です。
mermaid `graph TD` の階層 layout に対応します。

著者は `node` で `parent` field を指定するだけで、 depth が auto 計算され、 親 → 子の edge も自動で引かれます。
組織図 / file tree / カテゴリ階層 / class 階層など、 一方向の階層構造に適しています。

## いつ使うか

`tree` は depth 2-5 / 子ノード 3-20 の階層図に最適です。

- 組織図 (CEO → CTO → Eng Manager → Engineer)
- file system / プロジェクト構成 (src → components → ui → Button)
- カテゴリ階層 (Electronics → Phone → iPhone)
- class 継承の図示 (Animal → Mammal → Dog)

枝が多すぎて 1 列に並ばない場合は [mindMap preset](/docs/cdl/presets/mind) の放射 layout を検討してください。

## なぜ専用 preset を分けたか

低位 API で tree を描くと、 depth ごとの lane 配置を手で管理して parent-child の edge も全て手書きする必要があります。
`tree` preset は `parent` から depth を auto 計算し、 edge も自動で生成するため、 著者は node 一覧を書くだけで階層が表現できます。

> mindMap との違い ... `tree` は depth ごとに lane が縦列 (vertical column) に並ぶ階層図、 `mindMap` は中心 root から放射状 (radial) に伸びる思考図。 階層が明確な組織図 / file tree なら `tree`、 ブレストやアイデア整理なら `mindMap` です。

## Signature

```ts
tree({ id: string, topic: string, nodeWidth?: number, defaultTone?: Tone })
  .node({ id, title, parent?, kind?, subtitle?, eyebrow? })
  .build()
```

[preview:presets/tree-demo]

## 引数

`tree` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | 図全体の identifier |
| `topic` | `string` | 必須 | 図上部の題名 |
| `nodeWidth` | `number` | 任意 | 1 node の幅 px、 default `320` |
| `defaultTone` | `Tone` | 任意 | edge の既定色調、 default `accent` |

`node` の引数は以下のとおりです。

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | `string` | 必須 | node id |
| `title` | `string` | 必須 | node 名 |
| `parent` | `string` | 任意 | 親 node id、 未指定なら root (depth 0) |
| `kind` | `NodeKind` | 任意 | default `card`、 service / database 等で override 可 |
| `subtitle` | `string` | 任意 | 補足 |
| `eyebrow` | `string` | 任意 | 上付き label |

## 完全な例

```ts
import { tree } from "@cardenelabs/cdl";

export const orgChart = tree({ id: "org", topic: "組織図" })
  .node({ id: "ceo", title: "CEO" })
  .node({ id: "cto", title: "CTO", parent: "ceo" })
  .node({ id: "cfo", title: "CFO", parent: "ceo" })
  .node({ id: "eng", title: "Eng Manager", parent: "cto" })
  .node({ id: "ops", title: "Ops Manager", parent: "cto" })
  .build();
```

[preview:presets/tree-demo]

## 関連

- [mindMap preset](/docs/cdl/presets/mind) — 中心から放射する layout
- [classDiagram preset](/docs/cdl/presets/class) — UML 風の継承を描きたい時
- [catalog の presets ページ](/catalog/presets)
