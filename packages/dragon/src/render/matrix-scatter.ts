/**
 * 2つの軸で置く図の、点数で点を打つ見た目 (`[shape: scatter]`、#3637) を描く部品と見た目の規則。見た目の元は #3622 の step 2 の動く試作の案B。
 *
 * 点の図の枠を区画の色で 4 つに塗り分け、真ん中の 5 点の所に破線を引く。課題を打った段の間だけ、点が入った区画を濃くして光らせる。
 * 点は打った段の線を引く時刻から出て最後の段まで残り、打った段の間だけ外に輪を重ねる。同じ点数の課題の名前は、打った段から点の名前の下に足す。
 * 打った段の間だけ、横と縦の軸から点まで区画の色の線を引き、軸の上に点数の札を出す。
 * 置く前の課題の表は課題を書いた順の行で、課題の名前と横と縦の点数を書き、打つ段の間だけ行を光らせる。
 * 点と名前と表の所は並べ方 (`kinds/matrix/layout.ts`)、軸と目盛りの描き方は軸のブロック (`blocks/axis/draw.ts`) が持つ。
 * この file は 2つの軸で置く図を描く部品 (`render/matrix.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { drawAxes } from "../blocks/axis/draw";
import { cs } from "../blocks/color/draw";
import { placeTime } from "../blocks/matrix-item/draw";
import { areaLabel, type MatrixArea, type MatrixDot, type MatrixLabel, type MatrixLayout, type MatrixRow, type MatrixTable } from "../kinds/matrix/layout";
import { textWidth } from "../layout/measure";
import type { Rect } from "../layout/scene";
import { MATRIX_LOOK, MATRIX_TYPE } from "../look/matrix";
import type { TextStyle } from "../look/values";
import { MOTION } from "../look/values";
import { partRadius } from "./corner";
import { ALWAYS, type Shown } from "./ink";
import { type Ctx, cssFont as font, esc, r1 } from "./parts";

const S = MATRIX_LOOK.scatter;
const T = MATRIX_TYPE;

/** 点数で点を打つ見た目の見た目の規則。枠と区画の地と光った区画、真ん中の線、目盛り、軸から点への線と点数の札、点と輪と名前、表 */
export const SCATTER_CSS = [
  `.dg-mx-frame{fill:var(--surf);stroke:var(--hair);stroke-width:${S.stroke.frame}}`,
  `.dg-mx-q{fill:var(--c);fill-opacity:${MATRIX_LOOK.tint.base}}`,
  `.dg-mx-qg{fill:var(--c);fill-opacity:${MATRIX_LOOK.tint.glow}}`,
  `.dg-mx-mid{fill:none;stroke:var(--line);stroke-width:${S.stroke.mid};stroke-dasharray:${S.dash.join(" ")}}`,
  `.dg-mx-tk{fill:none;stroke:var(--line);stroke-width:${S.stroke.tick}}`,
  `.dg-mx-tn{${font(T.tick)};fill:var(--mute)}`,
  `.dg-mx-gl{fill:none;stroke:var(--c);stroke-width:${S.stroke.guide};stroke-linecap:round}`,
  `.dg-mx-chip{fill:var(--surf);stroke:var(--c);stroke-width:${S.stroke.chip}}`,
  `.dg-mx-ct{${font(T.chip)};fill:var(--ct)}`,
  `.dg-mx-pt{fill:var(--c);stroke:var(--surf);stroke-width:${S.stroke.dot}}`,
  `.dg-mx-ring{fill:none;stroke:var(--c);stroke-width:${S.stroke.ring};stroke-opacity:${S.ring}}`,
  `.dg-mx-pn{${font(T.dot)};fill:var(--ink)}`,
  `.dg-mx-tb{fill:var(--surf);stroke:var(--hair);stroke-width:${S.stroke.frame}}`,
  ".dg-mx-tbh{fill:var(--sunk)}",
  `.dg-mx-tbl{fill:none;stroke:var(--hair);stroke-width:${S.stroke.frame}}`,
  `.dg-mx-tt{${font(T.table)};fill:var(--ink)}`,
  `.dg-mx-th{${font(T.th)};fill:var(--mute)}`,
  `.dg-mx-td{${font(T.td)};fill:var(--ink)}`,
  `.dg-mx-sc{${font(T.score)};fill:var(--ink)}`,
  `.dg-mx-rg{fill:var(--c);fill-opacity:${MATRIX_LOOK.tint.glow}}`,
].join("");

/** 揃え方の端から、字の四角の左の端までの割合 */
const SHIFT = { start: 0, middle: 0.5, end: 1 } as const;

/** 字 1 つ。字の記録 (`ctx.ink`) に見えている間 `shown` の字の四角を残す。`style` を足すと、字だけに動きを付ける */
function text(ctx: Ctx, cls: string, x: number, y: number, value: string, type: TextStyle, anchor: keyof typeof SHIFT, shown: Shown[] = ALWAYS, style = ""): string {
  const w = textWidth(value, type);
  ctx.ink.push({ text: value, rect: { x: x - w * SHIFT[anchor], y: y - type.size * 0.8, w, h: type.size }, shown });
  const a = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
  return `<text class="${cls}${style ? " dg-a" : ""}" x="${r1(x)}" y="${r1(y)}"${a}${style ? ` style="${style}"` : ""}>${esc(value)}</text>`;
}

/** 四角の属性 */
const rectOf = (r: Rect, radius = 0): string => `x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}"${radius > 0 ? ` rx="${r1(radius)}"` : ""}`;

/** 区画の四角の属性 `rect` を受け、課題を受けた段の間だけ重ねる濃い地を返す部品 */
export type AreaGlow = (area: MatrixArea, cls: string, rect: string) => string;

/** 点の図の枠の区画 1 つ。薄い地と、課題を受けた段の間だけ重ねる濃い地と、角の名前 */
function quarterOf(area: MatrixArea, glow: AreaGlow, ctx: Ctx): string {
  const at = area.label ?? areaLabel(area);
  const rect = rectOf(area);
  return `<g data-matrix-area="${esc(area.id)}" style="${cs(area.color)}"><rect class="dg-mx-q" ${rect}/>${glow(area, "dg-mx-qg", rect)}${text(ctx, "dg-mx-name", at.x, at.y, area.name, T.area, at.anchor)}</g>`;
}

/** 軸の上の点数の札。`at` を札の真ん中にする */
function chipOf(ctx: Ctx, at: [number, number], value: string, shown: Shown[]): string {
  const w = textWidth(value, T.chip) + S.chip.padX * 2;
  const r = { x: at[0] - w / 2, y: at[1] - S.chip.h / 2, w, h: S.chip.h };
  return `<rect class="dg-mx-chip" ${rectOf(r, partRadius(ctx.corner, S.chip.radius))}/>${text(ctx, "dg-mx-ct", at[0], at[1] + T.chip.size * MATRIX_LOOK.baseline, value, T.chip, "middle", shown)}`;
}

/** 打った段の、横と縦の軸から点への線と軸の上の点数の札。打つ時刻から段の終わりまで出る */
function guidesOf(dot: MatrixDot, plot: Rect, ctx: Ctx): string {
  const bottom = plot.y + plot.h;
  const gap = S.dot.r + S.stroke.dot * 2;
  return dot.plots
    .map((p, k) => {
      const { start, span } = placeTime(ctx, p.step, p.event);
      const shown: Shown[] = [[start, span.end + MOTION.fade]];
      const lines = `<path class="dg-mx-gl" d="M${r1(dot.x)} ${r1(bottom)}L${r1(dot.x)} ${r1(dot.y + gap)}"/><path class="dg-mx-gl" d="M${r1(plot.x)} ${r1(dot.y)}L${r1(dot.x - gap)} ${r1(dot.y)}"/>`;
      const chips = chipOf(ctx, [dot.x, bottom], String(dot.score[0]), shown) + chipOf(ctx, [plot.x, dot.y], String(dot.score[1]), shown);
      return `<g class="dg-a" data-matrix-guide="${esc(dot.ids[k] as string)}" style="${cs(dot.color)};${ctx.m.vis(start, span.end)}">${lines}${chips}</g>`;
    })
    .join("");
}

/** 打った点 1 つ。点と、打った段ごとの輪と、名前。後の段で足した名前は、その段から出る */
function dotOf(dot: MatrixDot, ctx: Ctx): string {
  const { m } = ctx;
  const times = dot.plots.map((p) => placeTime(ctx, p.step, p.event));
  const first = times[0];
  if (!first) return "";
  const rings = times.map((t) => `<circle class="dg-mx-ring dg-a" cx="${r1(dot.x)}" cy="${r1(dot.y)}" r="${S.dot.ring}" style="${m.vis(t.start, t.span.end, { within: true })}"/>`).join("");
  const label: MatrixLabel = dot.label;
  const names = dot.names
    .map((name, k) => {
      const t = times[k] ?? first;
      const shown: Shown[] = [[t.drawn, Number.POSITIVE_INFINITY]];
      return text(ctx, "dg-mx-pn", label.x, label.y + k * S.dot.line, name, T.dot, label.anchor, shown, k === 0 ? "" : m.vis(t.start, m.last));
    })
    .join("");
  return (
    `<g class="dg-a" data-matrix-dot="${esc(dot.ids.join(" "))}" style="${cs(dot.color)};${m.vis(first.start, m.last)}">` +
    `${rings}<circle class="dg-mx-pt" cx="${r1(dot.x)}" cy="${r1(dot.y)}" r="${S.dot.r}"/>${names}</g>`
  );
}

/** 置く前の課題の表の行 1 つ。打つ段の間だけ行を光らせる */
function rowOf(row: MatrixRow, table: MatrixTable, ctx: Ctx): string {
  const y = row.y + row.h / 2 + T.td.size * MATRIX_LOOK.baseline;
  const sy = row.y + row.h / 2 + T.score.size * MATRIX_LOOK.baseline;
  const inset = (S.table.row - S.chip.h) / 4;
  const band = { x: row.x, y: row.y + inset, w: row.w, h: row.h - inset * 2 };
  const plot = row.plot ? placeTime(ctx, row.plot.step, row.plot.event) : undefined;
  const glow = plot ? `<rect class="dg-mx-rg dg-a" data-matrix-row-glow="${esc(row.id)}" ${rectOf(band, partRadius(ctx.corner, S.chip.radius))} style="${ctx.m.vis(plot.start, plot.span.end)}"/>` : "";
  const [nameX, xCol, yCol] = table.cols;
  const scores = row.score.map((v, k) => (v === "" ? "" : text(ctx, "dg-mx-sc", k === 0 ? xCol : yCol, sy, v, T.score, "middle"))).join("");
  return `<g data-matrix-row="${esc(row.id)}" style="${cs(row.color)}">${glow}${text(ctx, "dg-mx-td", nameX, y, row.name, T.td, "start")}${scores}</g>`;
}

/** 置く前の課題の表。地と題の帯と、列の見出しと、行 */
function tableOf(table: MatrixTable, rows: readonly MatrixRow[], ctx: Ctx): string {
  const L = S.table;
  const radius = partRadius(ctx.corner, L.radius);
  const headY = table.y + L.head;
  const colY = headY + L.cols / 2 + T.th.size * MATRIX_LOOK.baseline;
  const [nameX, xCol, yCol] = table.cols;
  const [item, xHead, yHead] = table.heads;
  return (
    `<g data-matrix-table=""><rect class="dg-mx-tb" ${rectOf(table, radius)} ${ctx.sh}/>` +
    `<path class="dg-mx-tbh" d="M${r1(table.x)} ${r1(headY)}V${r1(table.y + radius)}Q${r1(table.x)} ${r1(table.y)} ${r1(table.x + radius)} ${r1(table.y)}H${r1(table.x + table.w - radius)}Q${r1(table.x + table.w)} ${r1(table.y)} ${r1(table.x + table.w)} ${r1(table.y + radius)}V${r1(headY)}Z"/>` +
    `<path class="dg-mx-tbl" d="M${r1(table.x)} ${r1(headY)}H${r1(table.x + table.w)}"/>` +
    text(ctx, "dg-mx-tt", table.x + L.padX, table.y + L.head / 2 + T.table.size * MATRIX_LOOK.baseline, table.title, T.table, "start") +
    text(ctx, "dg-mx-th", nameX, colY, item, T.th, "start") +
    text(ctx, "dg-mx-th", xCol, colY, xHead, T.th, "middle") +
    text(ctx, "dg-mx-th", yCol, colY, yHead, T.th, "middle") +
    rows.map((row) => rowOf(row, table, ctx)).join("") +
    "</g>"
  );
}

/** 点数で点を打つ見た目の枠と区画と軸と表 (`base`) と、軸からの線と点 (`node`) と、見た目の規則。点は軸からの線の上に描く */
export function drawScatter(layout: MatrixLayout, ctx: Ctx, css: string, glow: AreaGlow): { base: string; node: string; css: string } {
  const plot = layout.plot as Rect;
  const dots = layout.dots ?? [];
  const midX = plot.x + plot.w / 2;
  const midY = plot.y + plot.h / 2;
  const frame = `<rect class="dg-mx-frame" ${rectOf(plot)}/>`;
  const mid = `<path class="dg-mx-mid" d="M${r1(midX)} ${r1(plot.y)}V${r1(plot.y + plot.h)}M${r1(plot.x)} ${r1(midY)}H${r1(plot.x + plot.w)}"/>`;
  const table = layout.table ? tableOf(layout.table, layout.rows ?? [], ctx) : "";
  return {
    base: `${frame}${layout.areas.map((area) => quarterOf(area, glow, ctx)).join("")}${mid}${drawAxes(layout.axes, ctx)}${table}`,
    node: `${dots.map((dot) => guidesOf(dot, plot, ctx)).join("")}${dots.map((dot) => dotOf(dot, ctx)).join("")}`,
    css: `${css}${SCATTER_CSS}`,
  };
}
