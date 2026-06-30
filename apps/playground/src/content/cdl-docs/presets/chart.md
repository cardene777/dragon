# chart preset

`chart` preset は統計チャート (pie / bar / line) を 1 つの API でカバーする高位 API です。
mermaid `pie` / community plugin の bar / xy chart に対応します。

cdl 本体は「動く SVG diagram」 が主軸のため、 chart 描画は「数値カード列 + edge 連結」 で表現する抽象描画です。
グラフィカルな bar の長さ表現や circle 面積比率は描画しませんが、 数値とラベルを並べた可読性の高い形で表示します。

## いつ使うか

`chart` は docs 中で簡易的に数値を共有したいときに最適です。

- 機能利用比率 (Web 45% / Mobile 35% / API 20%) を pie で
- 月次 KPI 推移 (Jan 1000 / Feb 1300 / Mar 1100) を line で
- カテゴリ別件数 (A 100 / B 200 / C 150) を bar で

統計分析の本格 chart が必要なら recharts / d3 等の専用 library を併用してください。
cdl の `chart` は説明 / 共有用の軽量実装です。

## type 別の挙動

| type | subtitle | edge |
|---|---|---|
| `pie` | `<value>` を total に対する % で表示 (`45.0%`) | なし |
| `bar` | `<value>` を `1,500` 等の絶対値で表示 | なし |
| `line` | `<value>` を絶対値で表示 | 前 datum → 次 datum、 増 ↑ / 減 ↓ |

## Signature

```ts
chart({ id: string, topic: string, type: "pie" | "bar" | "line",
        itemWidth?: number, defaultTone?: Tone })
  .datum({ id, label, value: number, tone? })
  .build()
```

[preview:presets/chart-pie-demo]
[preview:presets/chart-line-demo]

## 完全な例 — pie chart

```ts
import { chart } from "@cardenelabs/cdl";

export const marketShare = chart({ id: "share", topic: "Market share", type: "pie" })
  .datum({ id: "web", label: "Web", value: 45 })
  .datum({ id: "mobile", label: "Mobile", value: 35 })
  .datum({ id: "api", label: "API", value: 20 })
  .build();
```

## 完全な例 — line chart

```ts
import { chart } from "@cardenelabs/cdl";

export const mrr = chart({ id: "mrr", topic: "MRR (line)", type: "line" })
  .datum({ id: "jan", label: "Jan", value: 1000 })
  .datum({ id: "feb", label: "Feb", value: 1300 })
  .datum({ id: "mar", label: "Mar", value: 1100 })
  .datum({ id: "apr", label: "Apr", value: 1600 })
  .build();
```

[preview:presets/chart-line-demo]

## 関連

- [funnel preset](/docs/cdl/presets/funnel) — 階層的な数値推移
- [quadrant preset](/docs/cdl/presets/quadrant) — 2 軸評価
