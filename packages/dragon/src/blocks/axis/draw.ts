/**
 * 軸の描き方 (#3622)。
 *
 * 軸の線を小さい側の端から大きい側の端まで引き、大きい側の端に山形の矢じりを付ける。軸の名前と両端の字は軸の外に置く。
 * 縦の軸の字は左へ 90 度回し、下から上へ読ませる。字の記録 (`ctx.ink`) には回した後の字の四角を残し、崩れの確かめが重なりを測れるようにする。
 * 軸の所と字の所は並べ方 (`kinds/matrix/layout.ts`) が持つ。
 * この file は 2つの軸で置く図を描く部品 (`render/matrix.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import type { MatrixAxisPlaced, MatrixAxisText } from "../../kinds/matrix/layout";
import { textWidth } from "../../layout/measure";
import type { Rect } from "../../layout/scene";
import { MATRIX_LOOK, MATRIX_TYPE } from "../../look/matrix";
import { ALWAYS } from "../../render/ink";
import { type Ctx, esc, r1 } from "../../render/parts";

/** 軸の字の、回す前の字の四角の左の端から基準の点までの割合。始まりは 0、真ん中は半分、終わりは全て */
const SHIFT = { start: 0, middle: 0.5, end: 1 } as const;

/** 軸の字 1 つ。名前は太い字、両端の字は細い字で書く。縦の軸は基準の点を軸に左へ 90 度回す */
function axisText(t: MatrixAxisText, name: boolean, turned: boolean, ctx: Ctx): string {
  const style = name ? MATRIX_TYPE.axis : MATRIX_TYPE.end;
  const w = textWidth(t.text, style);
  const [x, y] = t.at;
  // 回す前の字は基準の点から左へ w * SHIFT、上へ大きさの 8 割、下へ 2 割を占める。左へ 90 度回すと、上下が左右に、左右が下上に替わる
  const u = -w * SHIFT[t.anchor];
  const rect: Rect = turned ? { x: x - style.size * 0.8, y: y - (u + w), w: style.size, h: w } : { x: x + u, y: y - style.size * 0.8, w, h: style.size };
  ctx.ink.push({ text: t.text, rect, shown: ALWAYS });
  const turn = turned ? ` transform="rotate(-90 ${r1(x)} ${r1(y)})"` : "";
  return `<text class="${name ? "dg-mx-an" : "dg-mx-ae"}" x="${r1(x)}" y="${r1(y)}"${t.anchor === "start" ? "" : ` text-anchor="${t.anchor}"`}${turn}>${esc(t.text)}</text>`;
}

/** 軸 1 つ。線と矢じりと字 */
function axisOf(axis: MatrixAxisPlaced, ctx: Ctx): string {
  const [[ax, ay], [bx, by]] = axis.line;
  const len = Math.hypot(bx - ax, by - ay) || 1;
  const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
  const { back, half } = MATRIX_LOOK.axis;
  const wing = (side: number): string => `${r1(bx - ux * back - uy * half * side)} ${r1(by - uy * back + ux * half * side)}`;
  return (
    `<g data-matrix-axis="${axis.dir}">` +
    `<path class="dg-mx-ax" d="M${r1(ax)} ${r1(ay)}L${r1(bx)} ${r1(by)}"/>` +
    `<path class="dg-mx-ax" data-matrix-arrow="" d="M${wing(1)}L${r1(bx)} ${r1(by)}L${wing(-1)}"/>` +
    // 真ん中に置く字が軸の名前で、両端の字は始まりと終わりに揃える
    axis.texts.map((t) => axisText(t, t.anchor === "middle", axis.dir === "y", ctx)).join("") +
    "</g>"
  );
}

/** 2つの軸で置く図の横の軸と縦の軸 */
export const drawAxes = (axes: readonly MatrixAxisPlaced[], ctx: Ctx): string => axes.map((axis) => axisOf(axis, ctx)).join("");
