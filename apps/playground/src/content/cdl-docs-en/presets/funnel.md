# funnel preset

`funnel` is a high-level API for marketing / sales funnels (the funnel-shaped sequence of stages).
It corresponds to the `funnelChart` mermaid community plugin.

Each `stage` holds a `count`, and the **drop rate** vs. the previous stage is automatically computed and shown in the subtitle.
You can describe stages such as Awareness → Consideration → Decision → Action together with their absolute and relative numbers in a single chart.

## When to use

`funnel` is great for marketing / sales / growth analytics.

- AARRR (Acquisition / Activation / Retention / Referral / Revenue) head counts
- Signup funnels (Visit → Sign up → Trial → Paid) with drop-rate analysis
- Support ticket priorities (Low → Mid → High) to surface escalation rate

For 2-3 stages a simple table may be enough.
For more than 6 stages, `chart bar` is usually easier to read than `funnel`.

## Why a dedicated preset

With the low-level API you would calculate the drop rate between stages by hand.
`funnel` derives it for you, so just declaring `count` already gives you analysis like "Visit → Sign up: 85% drop" in the subtitle.

## Signature

```ts
funnel({ id: string, topic: string, stageWidth?: number, defaultTone?: Tone })
  .stage({ id, title, count: number, subtitle? })
  .build()
```

[preview:presets/funnel-demo]

## Auto-generated subtitle

The subtitle of each stage is composed as follows.

- First stage ... `10,000 件`
- Second and later ... `1,500 件 / drop 85.0%`
- An explicit `subtitle` is appended after the derived parts.

## Complete example

```ts
import { funnel } from "@cardenelabs/cdl";

export const conversionFunnel = funnel({ id: "sales", topic: "Conversion funnel" })
  .stage({ id: "visit", title: "Visit", count: 10000 })
  .stage({ id: "signup", title: "Sign up", count: 1500 })
  .stage({ id: "trial", title: "Trial", count: 800 })
  .stage({ id: "paid", title: "Paid", count: 200 })
  .build();
```

[preview:presets/funnel-demo]

## See also

- [userJourney preset](/docs/en/cdl/presets/journey) — focus on emotions instead of numbers
- [chart preset (bar)](/docs/en/cdl/presets/chart) — for side-by-side comparisons
- [quadrant preset](/docs/en/cdl/presets/quadrant) — 2-axis priority matrix
