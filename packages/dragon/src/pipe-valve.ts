/**
 * 配管の図の弁が描く形を囲む四角と、取っ手の向き (#3418)。
 *
 * 弁は管の上の 2 つの三角 (胴) と、管から立つ軸と、軸の先の取っ手で描く (`blocks/hold/draw.ts` の `valve`)。
 * 取っ手は閉じた時に管と直角に立ち、開いた時に管の向きに倒れるため、両方の向きの四角を持つ。
 * 軸と取っ手は管の上 (縦の管は右) に立て、上の側にほかの線が通る弁は下 (縦の管は左) に立てる (`under`)。
 * 並べ方 (`kinds/pipe/layout.ts`) は弁の置き場所をほかの線から離す時に、決まりの表 (`pipe-rules.ts`) は弁とほかの線の間を測る時に、同じ四角を読む
 */
import type { Point, Rect } from "./layout/scene";
import { PIPE_LOOK } from "./look/pipe";

const V = PIPE_LOOK.valve;

/** 取っ手の軸の点。管から `stem` 離れた所 */
export function valvePivot(x: number, y: number, vertical: boolean, under: boolean): Point {
  const s = under ? -1 : 1;
  return vertical ? [x + s * V.stem, y] : [x, y - s * V.stem];
}

/** 取っ手の向き (度)。閉じた取っ手は管と直角に外へ立ち、開いた取っ手は管の向き (横の管は右、縦の管は下) に倒れる */
export function valveLever(vertical: boolean, opened: boolean, under: boolean): number {
  if (opened) return vertical ? 90 : 0;
  if (vertical) return under ? 180 : 0;
  return under ? 90 : -90;
}

/** 弁の胴と、軸と閉じた取っ手と、開いた取っ手を囲む四角 */
export function valveRects(x: number, y: number, vertical: boolean, under = false): Rect[] {
  const h = V.leverH / 2;
  const [px, py] = valvePivot(x, y, vertical, under);
  const reach = V.stem + V.lever - h;
  if (vertical)
    return [
      { x: x - V.half, y: y - V.r, w: V.half * 2, h: V.r * 2 },
      under ? { x: x - reach, y: y - h, w: reach, h: V.leverH } : { x, y: y - h, w: reach, h: V.leverH },
      { x: px - h, y: py - h, w: V.leverH, h: V.lever },
    ];
  return [
    { x: x - V.r, y: y - V.half, w: V.r * 2, h: V.half * 2 },
    under ? { x: x - h, y, w: V.leverH, h: reach } : { x: x - h, y: y - reach, w: V.leverH, h: reach },
    { x: px - h, y: py - h, w: V.lever, h: V.leverH },
  ];
}
