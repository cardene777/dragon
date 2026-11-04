/**
 * チップの描き方と、列の図の部品の描き方が共に使う下請け (#3239、#3351、#3348)。
 *
 * チップは席に居る間ごとに 1 つの部品で、色付きのチップは縁をその色で描いて光らせ、札の中の色の無いチップは薄く出す。
 * 席へ滑るか弾んで現れる動きと、席を離れる動きは、列の図を描く部品 (`render/lineup.ts`) が席の時刻から組んで渡す。
 * 列の図のブロック (列の並び、封、選ぶ、札、置き場、役、凡例) の描き方は、ここの矩形と折った字と矢印の下請けを使う。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupSeat, LineupText } from "../../kinds/lineup/layout";
import { hasWide } from "../../layout/measure";
import type { Point } from "../../layout/scene";
import type { ColorKey, Corner, TextStyle } from "../../look/values";
import { TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { frameShape, partRadius } from "../../render/corner";
import { ALWAYS, type Shown } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";

/** 角の丸い矩形。`extra` は class の後ろに足す属性 */
export const rect = (cls: string, r: { x: number; y: number; w: number; h: number }, rx: number, extra = ""): string =>
  `<rect class="${cls}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}" rx="${rx}"${extra}/>`;

/** 卓の札と置き場と役の箱とその光。角を落とす色味では右上と左下を落とす (#3344) */
export const lineupFrame = (corner: Corner, cls: string, r: { x: number; y: number; w: number; h: number }, rx: number, extra = ""): string =>
  frameShape(corner, ` class="${cls}"${extra}`, r, rect(cls, r, rx, extra));

/** 点を直線で結ぶ線 */
const pathOf = (points: Point[]): string => points.map(([x, y], k) => `${k === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join("");

/** 矢じりの付いた線。終わりの点で、線の向きに `head` の長さの矢じりを付ける */
export function arrowPath(points: Point[], head: number): string {
  const end = points.at(-1) as Point;
  const before = points.at(-2) as Point;
  const len = Math.hypot(end[0] - before[0], end[1] - before[1]) || 1;
  const ux = (end[0] - before[0]) / len;
  const uy = (end[1] - before[1]) / len;
  const wing = (side: number): Point => [end[0] - ux * head - uy * head * side, end[1] - uy * head + ux * head * side];
  return `${pathOf(points)}${pathOf([wing(1), end, wing(-1)])}`;
}

/** 折った字を 1 行ずつ描く。等幅の字で和文を含む行は、和文の字の class `wide` を足す */
export function lines(ctx: Ctx, cls: string, t: LineupText, style: TextStyle, shown: Shown[] = ALWAYS, wide = ""): string {
  return t.lines.map((l) => write(ctx.ink, wide !== "" && style.family === "mono" && hasWide(l.text) ? `${cls} ${wide}` : cls, l.x, l.baseline, l.text, style, shown)).join("");
}

/**
 * 席 `c` に居るチップ 1 枚。`color` はチップの色 (色の無いチップは `undefined`)、`dim` は札の中の色の無いチップを薄く出すか、
 * `shown` は字を見せる間 (封が隠す間を除く)。`kf` は席へ現れて離れる動きで、字を書いた後に組む
 */
export function chip(c: LineupSeat, color: ColorKey | undefined, dim: boolean, shown: Shown[], kf: () => string, ctx: Ctx): string {
  const radius = partRadius(ctx.corner, LINEUP_LOOK.chip.radius);
  const frame = rect(color ? "dg-ln-cc" : "dg-ln-cf", c, radius, ' data-lineup-chip-frame=""');
  const glow = color ? rect("dg-ln-cg", c, radius) : "";
  const text = lines(ctx, dim ? "dg-ln-t dg-ln-tf" : "dg-ln-t", c.label, TYPE.chip, shown, "dg-ln-tj");
  const flags = `${color ? ' data-lineup-glow=""' : ""}${dim ? ' data-lineup-faint=""' : ""}`;
  return `<g class="dg-popc dg-a" data-lineup-chip="${esc(c.id)}" data-lineup-on="${esc(c.lane)}" data-lineup-seat="${c.index}"${flags} style="${color ? `${cs(color)};` : ""}${kf()}">${frame}${glow}${text}</g>`;
}
