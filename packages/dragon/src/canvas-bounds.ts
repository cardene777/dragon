/**
 * canvas pivot 新 spec 図境界計算 helper (dragon canvas pivot spec §diagram-boundary)。
 *
 * 図の bounding box (点線四角) を「構成パーツの外接矩形 + 余白」 で計算する SSOT。
 * CDL の layout() を呼んで LaidDiagram.viewBox から外接矩形を取得し、 spec 準拠の 20px 余白を加える。
 *
 * 用途:
 *   - dragon editor で drag 中の overlay が「図の中」 に入ったか判定 (spec §4 自動調整発動)
 *   - dragon renderer で図 hover 時に dashed rect を描画 (spec 項目 4 の視覚 UI)
 *   - PR-B 以降で drag / resize / snap 判定の base rect として参照
 */

import type { CdlDiagram, LaidDiagram } from "@cardenelabs/cdl";
import { layout } from "@cardenelabs/cdl";

/** 図境界の padding (SVG unit)、 spec §diagram-boundary で 20 と定めた */
export const DIAGRAM_BOUNDARY_PADDING = 20;

export type DiagramBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * CdlDiagram の外接矩形 + 20px 余白を計算する。
 * layout() が返す LaidDiagram.viewBox は既に全 element を包む rect (右端 +80 / 下端 +80 の CDL 既定余白付き)。
 * それにさらに spec 準拠の 20px を加えて figure 判定 buffer とする。
 */
export function computeDiagramBoundingBox(diag: CdlDiagram): DiagramBoundingBox {
  const laid: LaidDiagram = layout(diag);
  const vb = laid.viewBox;
  return {
    x: vb.x - DIAGRAM_BOUNDARY_PADDING,
    y: vb.y - DIAGRAM_BOUNDARY_PADDING,
    width: vb.w + DIAGRAM_BOUNDARY_PADDING * 2,
    height: vb.h + DIAGRAM_BOUNDARY_PADDING * 2,
  };
}

/**
 * bbox 同士の重なり判定 (dragon canvas pivot spec §4 図内 drag 判定 SSOT)。
 * user 明示 「1 部でも重なれば中」 = 交差面積 > 0 を判定。
 */
export function rectsOverlap(a: DiagramBoundingBox, b: DiagramBoundingBox): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;
  return a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y;
}
