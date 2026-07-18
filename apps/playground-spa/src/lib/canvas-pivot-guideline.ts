/**
 * canvas pivot 新 spec 整列補助線 logic (spec 項目 6)。
 *
 * spec §6 = drag 中に他パーツとの edge alignment (top / center / bottom の 3 線) を検出、
 * 該当線があれば横補助線が画面に表示、 drag 対象がその線に snap して整列
 * (Google Slides / Miro 相当)。
 *
 * 判定基準:
 * - top edge = 各パーツの上端 Y
 * - center = 各パーツの中心 Y
 * - bottom edge = 各パーツの下端 Y
 * - 縦軸 (左端 / 中心 / 右端) も同様
 *
 * snap tolerance = default 6 CSS px (UX 経験値、 spec 実装時に微調整)。
 * drag 対象 rect のいずれかの edge と 他パーツ rect のいずれかの edge が tolerance 以内なら snap 発火。
 */

export interface GuidelineRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GuidelineAxis = "top" | "center-y" | "bottom" | "left" | "center-x" | "right";

export interface Guideline {
  axis: "horizontal" | "vertical";
  /** 補助線 座標 (horizontal なら y、 vertical なら x)、 client / CSS px 単位 */
  coord: number;
  /** snap 適用時に drag 対象を shift すべき delta (client / CSS px)、 x か y (axis に依存) */
  snapDelta: number;
  /** どの edge 対比で検出したか (debug / test 用) */
  kind: {
    dragEdge: GuidelineAxis;
    targetEdge: GuidelineAxis;
    targetId: string;
  };
}

/** snap tolerance (CSS px) */
export const GUIDELINE_SNAP_TOLERANCE = 6;

/**
 * drag 対象 rect と 他パーツ rect 群を照合、 top / center / bottom + left / center / right の 3 x 2 = 6 種 edge で
 * alignment 判定。 tolerance 以内で最も近い alignment を Guideline として返す。
 * 返り値 = 検出した guideline の array (axis: horizontal/vertical 別で最大 各 1 個 = 計 2 個まで)。
 */
export function detectGuidelines(
  drag: GuidelineRect,
  targets: Array<{ id: string; rect: GuidelineRect }>,
  tolerance = GUIDELINE_SNAP_TOLERANCE,
): Guideline[] {
  const dragTop = drag.y;
  const dragCY = drag.y + drag.height / 2;
  const dragBottom = drag.y + drag.height;
  const dragLeft = drag.x;
  const dragCX = drag.x + drag.width / 2;
  const dragRight = drag.x + drag.width;

  let bestH: Guideline | null = null;
  let bestV: Guideline | null = null;

  const horizontalCandidates: Array<{ dragVal: number; edge: GuidelineAxis }> = [
    { dragVal: dragTop, edge: "top" },
    { dragVal: dragCY, edge: "center-y" },
    { dragVal: dragBottom, edge: "bottom" },
  ];
  const verticalCandidates: Array<{ dragVal: number; edge: GuidelineAxis }> = [
    { dragVal: dragLeft, edge: "left" },
    { dragVal: dragCX, edge: "center-x" },
    { dragVal: dragRight, edge: "right" },
  ];

  for (const t of targets) {
    const tTop = t.rect.y;
    const tCY = t.rect.y + t.rect.height / 2;
    const tBottom = t.rect.y + t.rect.height;
    const tLeft = t.rect.x;
    const tCX = t.rect.x + t.rect.width / 2;
    const tRight = t.rect.x + t.rect.width;

    const targetH: Array<{ val: number; edge: GuidelineAxis }> = [
      { val: tTop, edge: "top" },
      { val: tCY, edge: "center-y" },
      { val: tBottom, edge: "bottom" },
    ];
    const targetV: Array<{ val: number; edge: GuidelineAxis }> = [
      { val: tLeft, edge: "left" },
      { val: tCX, edge: "center-x" },
      { val: tRight, edge: "right" },
    ];

    for (const dc of horizontalCandidates) {
      for (const tc of targetH) {
        const diff = tc.val - dc.dragVal;
        if (Math.abs(diff) <= tolerance) {
          if (bestH === null || Math.abs(diff) < Math.abs(bestH.snapDelta)) {
            bestH = {
              axis: "horizontal",
              coord: tc.val,
              snapDelta: diff,
              kind: { dragEdge: dc.edge, targetEdge: tc.edge, targetId: t.id },
            };
          }
        }
      }
    }
    for (const dc of verticalCandidates) {
      for (const tc of targetV) {
        const diff = tc.val - dc.dragVal;
        if (Math.abs(diff) <= tolerance) {
          if (bestV === null || Math.abs(diff) < Math.abs(bestV.snapDelta)) {
            bestV = {
              axis: "vertical",
              coord: tc.val,
              snapDelta: diff,
              kind: { dragEdge: dc.edge, targetEdge: tc.edge, targetId: t.id },
            };
          }
        }
      }
    }
  }

  const out: Guideline[] = [];
  if (bestH) out.push(bestH);
  if (bestV) out.push(bestV);
  return out;
}
