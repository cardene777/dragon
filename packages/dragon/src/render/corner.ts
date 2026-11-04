/**
 * 図の箱の角の形 (#3344)。
 *
 * 角を落とす色味 (`Corner` の `cut`) は、図の箱と囲みと図の枠の右上と左下を `LOOK.corner.cut` 落とし、小さな部品の角を丸めない。
 * 丸い角の色味 (`round`) は今どおり `rx` で丸め、描く SVG を 1 字も変えない。
 */
import { type Corner, LOOK } from "../look/values";
import { r1 } from "./round";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 右上と左下を落とした形の path の `d`。落とす幅は形の幅か高さの 4 分の 1 を超えない */
export function cutCorners({ x, y, w, h }: Box): string {
  const c = Math.min(LOOK.corner.cut, w / 4, h / 4);
  return `M${r1(x)},${r1(y)}H${r1(x + w - c)}L${r1(x + w)},${r1(y + c)}V${r1(y + h)}H${r1(x + c)}L${r1(x)},${r1(y + h - c)}Z`;
}

/**
 * 図の箱と囲みと図の枠。角を落とす色味では右上と左下を落とした path を描き、丸い角の色味では今どおりの rect の `round` を返す。
 * `attrs` は path に付ける class などの属性で、前に空白を付けて渡す
 */
export const frameShape = (corner: Corner, attrs: string, box: Box, round: string): string =>
  corner === "cut" ? `<path${attrs} d="${cutCorners(box)}"/>` : round;

/** 小さな部品 (絵柄の枠、チップ、札、印) の角の丸み。角を落とす色味では丸めない */
export const partRadius = (corner: Corner, radius: number): number =>
  corner === "cut" ? 0 : radius;
