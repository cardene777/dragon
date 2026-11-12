/**
 * 選ぶ描き方 (#3239、#3351、#3348)。
 *
 * 選んだ札の縁に色が付き、頭に印 (「選ばれる」) が出る。どちらも次に別の札を選ぶまで見える。
 * ほかの札を薄くして濃く戻す動きと、見える間は、列の図を描く部品 (`render/lineup.ts`) が選ぶ出来事の時刻から組んで渡す。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupLane, LineupMark } from "../../kinds/lineup/layout";
import { LOOK, TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import { type Ctx, esc, write } from "../../render/parts";
import { cs } from "../color/draw";
import { lineupFrame, rect } from "../item/draw";

/** 選んだ帯 `lane` の縁の光。ボードの帯と同じ角の丸みで描く。`vis` は選んでから次に別の札を選ぶまで見える動き */
export function pickRing(lane: LineupLane, vis: string, ctx: Ctx): string {
  const N = LINEUP_LOOK;
  return `<g class="dg-a" data-lineup-ring="${esc(lane.id)}" style="${vis}">${lineupFrame(ctx.corner, "dg-halo", lane, partRadius(ctx.corner, N.board.radius))}${lineupFrame(ctx.corner, "dg-on", lane, partRadius(ctx.corner, N.board.radius))}</g>`;
}

/** 選んだ札 `lane` の頭の印。`a` から `b` の間だけ見える */
export function pickMark(mark: LineupMark, lane: string, a: number, b: number, ctx: Ctx): string {
  const N = LINEUP_LOOK;
  const text = write(ctx.ink, "dg-ln-mt", mark.x + mark.w / 2, mark.y + mark.h / 2 + LOOK.baseline.tag, mark.text, TYPE.laneMark, [[a, b]], "middle");
  return `<g class="dg-a" data-lineup-mark="${esc(lane)}" style="${cs(N.mark.color)};${ctx.m.vis(a, b)}">${rect("dg-ln-mark", mark, partRadius(ctx.corner, N.chip.radius))}${text}</g>`;
}
