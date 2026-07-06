# mindMapRadial preset

`mindMapRadial` preset は中心 node の周囲 8 方向 (45 度間隔) に branch を配置する radial 型の concept map を組む高位 API です。
「中心が視覚的に主役、 周囲の branch は同格の facet」 として見せたい時に選びます。 product overview / domain 360° / 「製品 / user / 市場 / roadmap」 型 radial chart 用途に向きます。

現行 `mindMap` (左から右へ横に成長する水平 tree) との違いは、 mindMapRadial が中心を固定 hub として扱い、 branch を 0° / 45° / 90° / 135° / 180° / 225° / 270° / 315° の 8 方向へ最大 8 件配置する点です。
branch position は呼出順で East (0°) から時計回りに SE / S / SW / W / NW / N / NE と割当てられます。

## いつ使うか

`mindMapRadial` は「中心」 が概念そのもので、 周囲は全て中心の facet であるケースに最適です。

- Product concept map (Product → Users / Roadmap / Metrics / Team / Design / Marketing / Support / Finance)
- Domain overview で「これが hub、 これらが facet」 を印象付けたい時
- 2 × 2 / 3 × 3 grid の dashboard を 1 枚の radial に凝縮する

parent → child の階層が本質的に深い場合は `mindMap` / `tree` を選択してください。 radial は中心から 1 階層のみを露出します。

## mindMap との違い

| 観点 | mindMap | mindMapRadial |
|---|---|---|
| 形状 | 左→右の水平 tree | 中心 hub + 8 方向 radial |
| 階層 | 多階層 (level 1 / 2 / …) | 1 階層のみ (center → branch) |
| branch 上限 | 無制限 | 最大 8 (9 件目は throw) |
| 用途 | ブレスト / 階層的アイデア整理 | concept overview / product 360° |
| 見え方 | アイデアが外側へ育つ | 核の周りに facet が並ぶ |

## Signature

```ts
mindMapRadial({
  id: string,
  topic: string,
  centerTitle: string,
  centerId?: string,       // default "center"
  radius?: number,         // world coord 距離、 default 350
  branchWidth?: number,    // default 260
  centerWidth?: number,    // default 260
  defaultTone?: Tone,
})
  .branch({ id, title, tone?, subtitle? })
  .build()
```

呼出順で position を割当てます。

| 呼出 index | 方向 |
|---|---|
| 0 | East (右) |
| 1 | South-East (右下) |
| 2 | South (下) |
| 3 | South-West (左下) |
| 4 | West (左) |
| 5 | North-West (左上) |
| 6 | North (上) |
| 7 | North-East (右上) |

[preview:presets/mindmap-radial-demo]

## 完全な例

```ts
import { mindMapRadial } from "@cardenelabs/cdl";

export const productRadial = mindMapRadial({
  id: "product-radial",
  topic: "Product 360°",
  centerTitle: "Product",
})
  .branch({ id: "users", title: "Users" })
  .branch({ id: "roadmap", title: "Roadmap" })
  .branch({ id: "metrics", title: "Metrics" })
  .branch({ id: "team", title: "Team" })
  .branch({ id: "design", title: "Design" })
  .branch({ id: "marketing", title: "Marketing" })
  .branch({ id: "support", title: "Support" })
  .branch({ id: "finance", title: "Finance" })
  .build();
```

[preview:presets/mindmap-radial-demo]

## 関連

- [mindMap preset](/docs/cdl/presets/mind) — 水平 tree + 多階層 branch
- [tree preset](/docs/cdl/presets/tree) — 階層が明確な組織図 / file tree
- [topology preset](/docs/cdl/presets/topology) — group + container で構成図を組む
