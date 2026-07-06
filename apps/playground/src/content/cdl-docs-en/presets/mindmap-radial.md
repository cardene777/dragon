# mindMapRadial preset

`mindMapRadial` is a high-level API for a radial concept map that positions branches around a center node in eight fixed directions (45 degrees apart).
Use it when you want the center to be visually dominant and the branches to fan out on all sides — a shape typical of concept maps, product overviews, or "product / user / market / roadmap" style radial charts.

Unlike `mindMap` (which grows from left to right as a horizontal tree), `mindMapRadial` treats the center as the fixed hub and places up to eight branches at 0° / 45° / 90° / 135° / 180° / 225° / 270° / 315°.
Branch positions are assigned in call order starting from due-East (0°) and rotating clockwise through SE / S / SW / W / NW / N / NE.

## When to use

`mindMapRadial` is best when the "center" is the concept and everything else is a peer facet of it.

- Product concept maps (Product → Users / Roadmap / Metrics / Team / Design / Marketing / Support / Finance)
- Domain overviews where you want the reader to feel "this is the hub, and these are its facets"
- 2 × 2 or 3 × 3 grid style dashboards distilled into one radial

If your data has genuine parent → child depth, use `mindMap` or `tree` — radial only exposes one level below the center.

## Compared to `mindMap`

| aspect | mindMap | mindMapRadial |
|---|---|---|
| shape | horizontal tree, left to right | radial hub, 8 directions from center |
| depth | multi-level (level 1 / 2 / …) | one level only (center → branch) |
| branch count | unlimited | max 8 (throws on the 9th) |
| use case | brainstorming, hierarchical ideation | concept overview, product 360° |
| feel | idea grows outward | facet map around a core |

## Signature

```ts
mindMapRadial({
  id: string,
  topic: string,
  centerTitle: string,
  centerId?: string,       // default "center"
  radius?: number,         // world coord distance, default 350
  branchWidth?: number,    // default 260
  centerWidth?: number,    // default 260
  defaultTone?: Tone,
})
  .branch({ id, title, tone?, subtitle? })
  .build()
```

Positions are assigned in call order:

| call index | direction |
|---|---|
| 0 | East (right) |
| 1 | South-East (bottom-right) |
| 2 | South (bottom) |
| 3 | South-West (bottom-left) |
| 4 | West (left) |
| 5 | North-West (top-left) |
| 6 | North (top) |
| 7 | North-East (top-right) |

[preview:presets/mindmap-radial-demo]

## Complete example

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

## See also

- [mindMap preset](/docs/en/cdl/presets/mind) — horizontal tree with multi-level branches
- [tree preset](/docs/en/cdl/presets/tree) — clear org chart / file tree hierarchy
- [topology preset](/docs/en/cdl/presets/topology) — grouped deployment / infrastructure layout
