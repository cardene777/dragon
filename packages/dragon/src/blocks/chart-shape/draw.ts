/**
 * 量の図の見た目の描き方 (#3560)。
 *
 * ドーナツは輪の地 (値の無い所) を薄い地の色の円の線で描き、横棒は一番大きい値の棒の長さの地を薄い地の色の四角で描く。
 * 弧と棒はこの地の上に、値のブロックの描き方 (`blocks/chart-set/draw.ts`) が描く。
 * この file は量の図を描く部品 (`render/chart.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { ChartBarRow } from "../../kinds/chart/layout";
import { CHART_LOOK } from "../../look/chart";
import { partRadius } from "../../render/corner";
import { type Ctx, r1 } from "../../render/parts";

/** ドーナツの輪の地 */
export const ringTrack = (ring: { cx: number; cy: number; r: number }): string => `<circle class="dg-ch-track" cx="${r1(ring.cx)}" cy="${r1(ring.cy)}" r="${r1(ring.r)}"/>`;

/** 横棒の 1 行の地 */
export const barTrack = (bar: ChartBarRow, ctx: Ctx): string =>
  `<rect class="dg-ch-bt" x="${r1(bar.track.x)}" y="${r1(bar.track.y)}" width="${r1(bar.track.w)}" height="${r1(bar.track.h)}" rx="${partRadius(ctx.corner, CHART_LOOK.bar.radius)}"/>`;
