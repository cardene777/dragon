# pie preset

The `pie` preset expresses a pie chart (equivalent to mermaid `pie`).
Each slice is one actor (`kind: card`); the `value` property holds the percentage.

## When to use

- Show share / breakdown / ratios on a single page.
- Visualize KPI composition (new / existing / churned, etc.).
- Express voting / survey results.

There is no dedicated pie rendering layout yet, so slices are placed inside a single group via the topology layout.
A full pie chart (angular slice layout, central label) is planned for a future PR.

## Minimal example

::: tabs

@@@ humans 👤 For humans

```text
title: "Share breakdown"
type: pie

actors:
  - A: { kind: card, value: "30%" }
  - B: { kind: card, value: "50%" }
  - C: { kind: card, value: "20%" }

states:
  a_share: 30
  b_share: 50

animation:
  - step: "rebalance" 1s
    focus: [A, B]
    tween:
      a_share: 30 -> 40
      b_share: 50 -> 40
    badge: "update"
```

@@@ llm 🤖 For LLM

```yaml
preset: pie
intent: "Share / ratio breakdown with percentage slices"
actors:
  - { id: A, kind: card, value: "30%" }
  - { id: B, kind: card, value: "50%" }
states:
  - { id: a_share, initial: 30 }
phases:
  - { id: rebalance, focus: [A, B], tweens: [a_share: 30->40] }
constraints:
  - "slice kind should be card; declare percentage in value"
  - "no dedicated pie layout yet, drawn as cards inside a group"
```

:::

## Arguments

The arguments mirror the other presets.
The `value` property of each actor (e.g. `"30%"`) represents the slice value.
Combine `states` + `animation` to animate slice values.

## Related

- [topology preset](/docs/en/cdl/presets/topology) — the base layout used here.
- [state primitive](/docs/en/cdl/primitives/state) — tween slice values.
