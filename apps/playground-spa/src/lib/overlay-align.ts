/**
 * overlay parts の alignment / distribution pure helper。
 * Miro / Figma 相当 = 選択 2+ の parts を 特定 axis に揃える / 均等配置。
 */

/**
 * align 対象 1 件の入力。
 *
 * `width` / `height` は「posX / posY を左上とした軸並行の寸法」 という前提の簡易指定。
 * rotate 済 parts ではこの前提が崩れる (実 AABB の左上は posX / posY と一致しない) ため、
 * 呼び出し側が実測できる場合は `bounds` に実 world AABB を渡す。 その場合は
 * 「現在の右端 / 中心 / 下端」 を bounds から求め、 posX / posY は delta で動かす。
 */
export type AlignParts = {
  id: string;
  posX: number;
  posY: number;
  scale: number;
  width: number;
  height: number;
  /** 実測した world AABB (rotate 込み)。 未指定なら posX/posY + width*scale で近似する。 */
  bounds?: { left: number; top: number; right: number; bottom: number };
};
export type AlignMode = "left" | "center-h" | "right" | "top" | "middle-v" | "bottom" | "distribute-h" | "distribute-v";

/** 実 AABB を取り出す。 bounds があればそれを、 無ければ posX/posY + width*scale で近似する。 */
function aabb(p: AlignParts): { left: number; top: number; right: number; bottom: number } {
  if (p.bounds) return p.bounds;
  return {
    left: p.posX,
    top: p.posY,
    right: p.posX + p.width * p.scale,
    bottom: p.posY + p.height * p.scale,
  };
}

/**
 * 選択 parts group を align mode に従って新 posX / posY を計算 (副作用なし、 pure)。
 * distribute-h/v は 3 個以上で有効、 2 個以下は変化なし。
 *
 * 位置は必ず「現在の AABB との差分」 で動かす。 posX に直接 目標値を代入すると、
 * rotate 済 parts で AABB の左上と posX がずれている分だけ結果が狂う。
 */
export function alignOverlayParts(parts: AlignParts[], mode: AlignMode): Map<string, { posX: number; posY: number }> {
  const result = new Map<string, { posX: number; posY: number }>();
  if (parts.length < 2) return result;
  if (mode === "left") {
    const minL = Math.min(...parts.map((p) => aabb(p).left));
    for (const p of parts) result.set(p.id, { posX: p.posX + (minL - aabb(p).left), posY: p.posY });
  } else if (mode === "right") {
    const maxR = Math.max(...parts.map((p) => aabb(p).right));
    for (const p of parts) result.set(p.id, { posX: p.posX + (maxR - aabb(p).right), posY: p.posY });
  } else if (mode === "center-h") {
    // 全 parts の中心 X 平均に揃える
    const avgCx = parts.reduce((sum, p) => { const b = aabb(p); return sum + (b.left + b.right) / 2; }, 0) / parts.length;
    for (const p of parts) {
      const b = aabb(p);
      result.set(p.id, { posX: p.posX + (avgCx - (b.left + b.right) / 2), posY: p.posY });
    }
  } else if (mode === "top") {
    const minT = Math.min(...parts.map((p) => aabb(p).top));
    for (const p of parts) result.set(p.id, { posX: p.posX, posY: p.posY + (minT - aabb(p).top) });
  } else if (mode === "bottom") {
    const maxB = Math.max(...parts.map((p) => aabb(p).bottom));
    for (const p of parts) result.set(p.id, { posX: p.posX, posY: p.posY + (maxB - aabb(p).bottom) });
  } else if (mode === "middle-v") {
    const avgCy = parts.reduce((sum, p) => { const b = aabb(p); return sum + (b.top + b.bottom) / 2; }, 0) / parts.length;
    for (const p of parts) {
      const b = aabb(p);
      result.set(p.id, { posX: p.posX, posY: p.posY + (avgCy - (b.top + b.bottom) / 2) });
    }
  } else if (mode === "distribute-h" && parts.length >= 3) {
    const sorted = [...parts].sort((a, b) => a.posX - b.posX);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const spacing = (last.posX - first.posX) / (sorted.length - 1);
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i]!;
      result.set(p.id, { posX: first.posX + spacing * i, posY: p.posY });
    }
  } else if (mode === "distribute-v" && parts.length >= 3) {
    const sorted = [...parts].sort((a, b) => a.posY - b.posY);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const spacing = (last.posY - first.posY) / (sorted.length - 1);
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i]!;
      result.set(p.id, { posX: p.posX, posY: first.posY + spacing * i });
    }
  }
  return result;
}
