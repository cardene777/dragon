/**
 * canvas pivot 新 spec の自動調整 logic (spec 項目 4 + 5)。
 *
 * spec §4 = drag 中パーツの bounding box が図の bounding box に 1 部でも重なったら、
 * 該当 preset の要素が「なめらかに間を開ける」 = CSS transient shift、 DSL 書込みなし。
 * drag 対象が範囲外に出たら shift を消して元復帰、 drop で shift 消去。
 *
 * spec §5 = Command キー押下中は自動調整無効 (bypass) = 全 preset で shift しない。
 *
 * 12 preset 別 shift direction:
 *   sequence  = 横 X   (lane を右に押し出す)
 *   flow      = 縦 Y   (node を下に押し出す)
 *   class     = 横 X
 *   gantt     = 順序 stack (track を下に push)
 *   topology  = 汎用 fallback (最小移動 8 方向最短)
 *   ER        = 横 X
 *   state     = 汎用 fallback
 *   c4        = 横 X (nested container 相対)
 *   mind      = 放射 (root 不動)
 *   pie       = shift 無効
 *   swimlane  = 縦 Y (lane を下に push)
 *   solidity  = 汎用 fallback
 */

export type PresetType = "sequence" | "flow" | "class" | "gantt" | "topology" | "er" | "state" | "c4" | "mind" | "pie" | "swimlane" | "solidity";

export type ShiftDirection = "x-positive" | "x-negative" | "y-positive" | "y-negative" | "stack-down" | "radial" | "fallback" | "none";

interface PresetShiftSpec {
  direction: ShiftDirection;
  magnitude: number;
}

const PRESET_SHIFT: Record<PresetType, PresetShiftSpec> = {
  sequence: { direction: "x-positive", magnitude: 40 },
  flow: { direction: "y-positive", magnitude: 60 },
  class: { direction: "x-positive", magnitude: 80 },
  gantt: { direction: "stack-down", magnitude: 40 },
  topology: { direction: "fallback", magnitude: 60 },
  er: { direction: "x-positive", magnitude: 100 },
  state: { direction: "fallback", magnitude: 60 },
  c4: { direction: "x-positive", magnitude: 120 },
  mind: { direction: "radial", magnitude: 40 },
  pie: { direction: "none", magnitude: 0 },
  swimlane: { direction: "y-positive", magnitude: 80 },
  solidity: { direction: "fallback", magnitude: 100 },
};

export interface DragBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * drag 対象と他 element の bounding rect が overlap しているか判定。
 * spec §4「1 部でも重なれば中」 = 交差面積 > 0。
 */
export function rectsOverlap(a: DragBBox, b: DragBBox): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;
  return a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y;
}

/**
 * preset 別の shift 方向 + magnitude を返す。 spec §4 で確定した 12 preset 別 SSOT。
 */
export function getPresetShiftSpec(preset: PresetType): PresetShiftSpec {
  return PRESET_SHIFT[preset];
}

/**
 * drag 対象 rect と 他 preset element rect が重なった場合の CSS transform 値を計算する。
 * shift direction に応じて translate(dx, dy) を返す。
 * commandBypass が true なら全 preset で translate(0, 0) = shift しない (spec §5)。
 */
export function computeCollisionShift(
  dragRect: DragBBox,
  targetRect: DragBBox,
  preset: PresetType,
  commandBypass: boolean,
): { dx: number; dy: number } {
  if (commandBypass) return { dx: 0, dy: 0 };
  if (!rectsOverlap(dragRect, targetRect)) return { dx: 0, dy: 0 };
  const spec = getPresetShiftSpec(preset);
  if (spec.direction === "none") return { dx: 0, dy: 0 };

  switch (spec.direction) {
    case "x-positive":
      return { dx: spec.magnitude, dy: 0 };
    case "x-negative":
      return { dx: -spec.magnitude, dy: 0 };
    case "y-positive":
    case "stack-down":
      return { dx: 0, dy: spec.magnitude };
    case "y-negative":
      return { dx: 0, dy: -spec.magnitude };
    case "radial": {
      // mind = 放射方向 = drag rect 中心から target rect 中心への方向ベクトル
      const cx1 = dragRect.x + dragRect.width / 2;
      const cy1 = dragRect.y + dragRect.height / 2;
      const cx2 = targetRect.x + targetRect.width / 2;
      const cy2 = targetRect.y + targetRect.height / 2;
      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      return { dx: (dx / len) * spec.magnitude, dy: (dy / len) * spec.magnitude };
    }
    case "fallback": {
      // topology / state / solidity = 8 方向最短で重なり解消
      const overlapX = Math.min(dragRect.x + dragRect.width - targetRect.x, targetRect.x + targetRect.width - dragRect.x);
      const overlapY = Math.min(dragRect.y + dragRect.height - targetRect.y, targetRect.y + targetRect.height - dragRect.y);
      if (overlapX < overlapY) {
        const cx1 = dragRect.x + dragRect.width / 2;
        const cx2 = targetRect.x + targetRect.width / 2;
        return { dx: cx2 > cx1 ? spec.magnitude : -spec.magnitude, dy: 0 };
      } else {
        const cy1 = dragRect.y + dragRect.height / 2;
        const cy2 = targetRect.y + targetRect.height / 2;
        return { dx: 0, dy: cy2 > cy1 ? spec.magnitude : -spec.magnitude };
      }
    }
    default:
      return { dx: 0, dy: 0 };
  }
}
