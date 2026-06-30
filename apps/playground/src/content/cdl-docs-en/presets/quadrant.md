# quadrant preset

`quadrant` is a high-level API for two-axis matrices (Priority matrix / SWOT / Eisenhower box / Effort-Impact matrix).
It corresponds to mermaid `quadrantChart`.

You declare `xAxis` (left / right) and `yAxis` (bottom / top), then place items into one of the four quadrants (`topLeft` / `topRight` / `bottomLeft` / `bottomRight`).
Header cards for each quadrant are added automatically, so you only need to place items.

## When to use

`quadrant` is great for priority calls and strategic planning.

- Priority matrix (Effort × Value, High value × Low effort → Quick win)
- Eisenhower box (Urgency × Importance, Important × Not urgent → Plan)
- SWOT (Strength × Weakness × Opportunity × Threat) — repurpose the four quadrants
- Risk matrix (Probability × Impact)

If you need more than two axes (e.g. radar chart), cdl does not currently support that style.

## Why a dedicated preset

With the low-level API you would calculate lane / stack positions per quadrant and place header cards yourself, which collapses easily once each quadrant has four or more items.
`quadrant` derives the four headers from `xAxis` / `yAxis`, computes lane (left / right) + stack from the quadrant flag, and leaves you to write just the placement and titles.

## Signature

```ts
quadrant({
  id: string,
  topic: string,
  xAxis: { left: string, right: string },
  yAxis: { bottom: string, top: string },
  quadrantLabels?: Record<QuadrantQuadrantLabel, string>,
  defaultTone?: Tone,
})
  .item({ id, title, quadrant: "topLeft" | "topRight" | "bottomLeft" | "bottomRight", subtitle? })
  .build()
```

[preview:presets/quad-demo]

## Layout

```
┌────────────────┬────────────────┐
│   topLeft      │   topRight     │  ← yAxis.top
│   (yT × xL)    │   (yT × xR)    │
├────────────────┼────────────────┤
│   bottomLeft   │   bottomRight  │  ← yAxis.bottom
│   (yB × xL)    │   (yB × xR)    │
└────────────────┴────────────────┘
   xAxis.left      xAxis.right
```

## Complete example

```ts
import { quadrant } from "@cardenelabs/cdl";

export const priorityMatrix = quadrant({
  id: "priority",
  topic: "Priority matrix",
  xAxis: { left: "Low effort", right: "High effort" },
  yAxis: { bottom: "Low value", top: "High value" },
})
  .item({ id: "qw", title: "Quick win", quadrant: "topLeft" })
  .item({ id: "mp", title: "Major project", quadrant: "topRight" })
  .item({ id: "fi", title: "Fill in", quadrant: "bottomLeft" })
  .item({ id: "tt", title: "Thankless", quadrant: "bottomRight" })
  .build();
```

[preview:presets/quad-demo]

## See also

- [funnel preset](/docs/en/cdl/presets/funnel) — single axis with a numeric trend
- [chart preset](/docs/en/cdl/presets/chart) — pure statistics view
