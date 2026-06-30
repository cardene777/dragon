# pie chart (via chart preset)

A `pie` chart is produced by the [chart preset](/docs/en/cdl/presets/chart) with `type: "pie"`.
There is no standalone `pie` preset; it is one mode of `chart`.

It corresponds to mermaid `pie`.
Each datum's `value` is rendered as its percentage of the total in the subtitle, so the reader can read off the ratios at a glance.

## When to use

`pie` is great for static share-of-pie callouts.

- Revenue split (Web 45% / Mobile 35% / API 20%)
- Feature usage ratio (top features A / B / C)
- Budget allocation (Engineering / Marketing / Operations)

For ratios that change over time, [chart preset (line)](/docs/en/cdl/presets/chart) reads better.

## Behaviour of `chart` with `type: "pie"`

- Each datum's subtitle becomes `<percentage>%` (e.g. `45.0%`)
- `total` is the sum of every datum's `value`, and the percentage is `value / total × 100`
- No edges are generated (purely parallel display)

## Signature

```ts
chart({ id: string, topic: string, type: "pie", itemWidth?: number, defaultTone?: Tone })
  .datum({ id, label, value: number, tone? })
  .build()
```

[preview:presets/chart-pie-demo]

## Complete example

```ts
import { chart } from "@cardenelabs/cdl";

export const marketShare = chart({ id: "share", topic: "Market share", type: "pie" })
  .datum({ id: "web", label: "Web", value: 45 })
  .datum({ id: "mobile", label: "Mobile", value: 35 })
  .datum({ id: "api", label: "API", value: 20 })
  .build();
```

[preview:presets/chart-pie-demo]

## See also

- [chart preset](/docs/en/cdl/presets/chart) — full 3-mode chart (bar / line + pie)
- [funnel preset](/docs/en/cdl/presets/funnel) — for stage-wise numeric trends
- [quadrant preset](/docs/en/cdl/presets/quadrant) — 2-axis evaluation
