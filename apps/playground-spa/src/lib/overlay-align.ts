/**
 * overlay parts の alignment / distribution pure helper。
 * Miro / Figma 相当 = 選択 2+ の parts を 特定 axis に揃える / 均等配置。
 */

export type AlignParts = { id: string; posX: number; posY: number; scale: number; width: number; height: number };
export type AlignMode = "left" | "center-h" | "right" | "top" | "middle-v" | "bottom" | "distribute-h" | "distribute-v";

/**
 * 選択 parts group を align mode に従って新 posX / posY を計算 (副作用なし、 pure)。
 * distribute-h/v は 3 個以上で有効、 2 個以下は変化なし。
 */
export function alignOverlayParts(parts: AlignParts[], mode: AlignMode): Map<string, { posX: number; posY: number }> {
  const result = new Map<string, { posX: number; posY: number }>();
  if (parts.length < 2) return result;
  if (mode === "left") {
    const minL = Math.min(...parts.map((p) => p.posX));
    for (const p of parts) result.set(p.id, { posX: minL, posY: p.posY });
  } else if (mode === "right") {
    const maxR = Math.max(...parts.map((p) => p.posX + p.width * p.scale));
    for (const p of parts) result.set(p.id, { posX: maxR - p.width * p.scale, posY: p.posY });
  } else if (mode === "center-h") {
    // 全 parts の中心 X 平均に揃える
    const avgCx = parts.reduce((sum, p) => sum + p.posX + (p.width * p.scale) / 2, 0) / parts.length;
    for (const p of parts) result.set(p.id, { posX: avgCx - (p.width * p.scale) / 2, posY: p.posY });
  } else if (mode === "top") {
    const minT = Math.min(...parts.map((p) => p.posY));
    for (const p of parts) result.set(p.id, { posX: p.posX, posY: minT });
  } else if (mode === "bottom") {
    const maxB = Math.max(...parts.map((p) => p.posY + p.height * p.scale));
    for (const p of parts) result.set(p.id, { posX: p.posX, posY: maxB - p.height * p.scale });
  } else if (mode === "middle-v") {
    const avgCy = parts.reduce((sum, p) => sum + p.posY + (p.height * p.scale) / 2, 0) / parts.length;
    for (const p of parts) result.set(p.id, { posX: p.posX, posY: avgCy - (p.height * p.scale) / 2 });
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
