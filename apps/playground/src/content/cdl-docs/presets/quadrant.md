# quadrant preset

`quadrant` preset は 2 軸 マトリクス (Priority matrix / SWOT / Eisenhower box / Effort-Impact matrix 等) を 4 象限に分けて item を配置する高位 API です。
mermaid `quadrantChart` に対応します。

著者は `xAxis` (left / right) と `yAxis` (bottom / top) を宣言し、 各 item を 4 象限 (`topLeft` / `topRight` / `bottomLeft` / `bottomRight`) のいずれかに配置します。
4 象限 header card は自動で生成され、 著者は item 配置だけで matrix が完成します。

## いつ使うか

`quadrant` は priority 決定 / strategic planning の共有に最適です。

- Priority matrix (Effort × Value、 High value × Low effort → Quick win)
- Eisenhower box (Urgency × Importance、 Important × Not urgent → Plan)
- SWOT (Strength × Weakness × Opportunity × Threat) ※ 4 象限の意味付けを変更
- Risk matrix (Probability × Impact)

3 軸以上の評価が必要なら radar chart 等が必要、 cdl では現状サポートされていません。

## なぜ専用 preset を分けたか

低位 API で 4 象限を描くと、 各 quadrant の lane / stack 計算と header card 配置を手で行う必要があり、 stack 数 4 以上の象限で配置が崩れやすくなります。
`quadrant` preset は xAxis + yAxis label から 4 象限 header を自動配置し、 item の quadrant 指定から lane (left / right) + stack を計算するため、 著者は配置位置と item title だけ書けばよくなります。

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

## 4 象限の配置

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

## 完全な例

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

## 関連

- [funnel preset](/docs/cdl/presets/funnel) — 1 軸の数値変化なら
- [chart preset](/docs/cdl/presets/chart) — 純粋な統計表示なら
