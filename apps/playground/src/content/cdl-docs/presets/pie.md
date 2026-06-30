# pie chart (via chart preset)

`pie` chart は [chart preset](/docs/cdl/presets/chart) の `type: "pie"` で生成します。
専用 preset としては存在せず、 chart preset の 1 mode です。

mermaid `pie` に対応します。
各 datum の `value` を total に対する % として subtitle に表示し、 視覚的に比率を確認できます。

## いつ使うか

`pie` は静的な比率共有に最適です。

- 売上構成比 (Web 45% / Mobile 35% / API 20%)
- 機能利用率 (主要機能 A / B / C)
- 予算配分 (Engineering / Marketing / Operations)

時系列の比率変化は [chart preset (line)](/docs/cdl/presets/chart) のほうが見やすいです。

## chart preset (pie) の挙動

- 各 datum の subtitle は `<percentage>%` (例 `45.0%`)
- total = 全 datum の value 合計、 各 datum の % は `value / total × 100`
- edge は生成されません (純粋な並列表示)

## Signature

```ts
chart({ id: string, topic: string, type: "pie", itemWidth?: number, defaultTone?: Tone })
  .datum({ id, label, value: number, tone? })
  .build()
```

[preview:presets/chart-pie-demo]

## 完全な例

```ts
import { chart } from "@cardenelabs/cdl";

export const marketShare = chart({ id: "share", topic: "Market share", type: "pie" })
  .datum({ id: "web", label: "Web", value: 45 })
  .datum({ id: "mobile", label: "Mobile", value: 35 })
  .datum({ id: "api", label: "API", value: 20 })
  .build();
```

[preview:presets/chart-pie-demo]

## 関連

- [chart preset](/docs/cdl/presets/chart) — bar / line も含めた 3 統合 chart
- [funnel preset](/docs/cdl/presets/funnel) — 段階的な数値推移を示したい時
- [quadrant preset](/docs/cdl/presets/quadrant) — 2 軸評価
