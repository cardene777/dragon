# chart preset

`chart` is a high-level API that covers statistical charts (pie / bar / line) under a single entry point.
It corresponds to mermaid `pie` and community plugins for bar / xy charts.

cdl is primarily an animated SVG diagram engine, so charts are expressed abstractly via numeric cards and edges.
You won't get a geometric pie slice or a metric-accurate bar length, but you do get a clean, readable display of numbers and labels.

## When to use

`chart` is great for quick numeric callouts inside docs.

- Feature usage ratio (Web 45% / Mobile 35% / API 20%) as a `pie`
- Monthly KPI trend (Jan 1000 / Feb 1300 / Mar 1100) as a `line`
- Per-category counts (A 100 / B 200 / C 150) as a `bar`

For analytic dashboards you should still reach for a dedicated charting library (recharts / d3, etc.).
The cdl `chart` preset is intentionally lightweight.

## Behaviour by type

| type | subtitle | edge |
|---|---|---|
| `pie` | `<value>` formatted as percentage of the total (`45.0%`) | none |
| `bar` | `<value>` formatted as absolute number (`1,500`) | none |
| `line` | `<value>` formatted as absolute number | previous → next datum, ↑ for increase, ↓ for decrease |

## Signature

```ts
chart({ id: string, topic: string, type: "pie" | "bar" | "line",
        itemWidth?: number, defaultTone?: Tone })
  .datum({ id, label, value: number, tone? })
  .build()
```

[preview:presets/chart-pie-demo]
[preview:presets/chart-line-demo]

## Complete example — pie chart

```ts
import { chart } from "@cardenelabs/cdl";

export const marketShare = chart({ id: "share", topic: "Market share", type: "pie" })
  .datum({ id: "web", label: "Web", value: 45 })
  .datum({ id: "mobile", label: "Mobile", value: 35 })
  .datum({ id: "api", label: "API", value: 20 })
  .build();
```

## Complete example — line chart

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

## See also

- [funnel preset](/docs/en/cdl/presets/funnel) — stage-wise numeric trend
- [quadrant preset](/docs/en/cdl/presets/quadrant) — 2-axis evaluation
