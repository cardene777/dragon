/**
 * 置き場の描き方 (#3351、#3348)。
 *
 * 順番の無い置き場 (`order: none`) の枠は点線で描き、ほかの箱 (札) の枠は実線に影を付けて描く。置き場と札の間には矢印を引く。
 * この file は列の図を描く部品 (`render/lineup.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupArrow, LineupLane } from "../../kinds/lineup/layout";
import { LINEUP_LOOK } from "../../look/lineup";
import type { Ctx } from "../../render/parts";
import { cs } from "../color/draw";
import { arrowPath, lineupFrame } from "../item/draw";

/** 列の箱 `lane` の枠。置き場は点線の枠、札は実線の枠に影を付ける */
export function laneFrame(lane: LineupLane, ctx: Ctx): string {
  const N = LINEUP_LOOK;
  const dash = lane.pool ? ` stroke-dasharray="${N.dash.join(" ")}"` : "";
  return lineupFrame(ctx.corner, lane.pool ? "dg-ln-pool" : "dg-ln-card", lane, N.radius, ` data-lineup-frame=""${dash}${lane.pool ? "" : ` ${ctx.sh}`}`);
}

/** 置き場と札の間の矢印 `a` */
export function poolArrow(a: LineupArrow): string {
  const N = LINEUP_LOOK;
  return `<path class="dg-ln-arrow" data-lineup-arrow="" d="${arrowPath(a.points, N.arrow.head)}" style="${cs(N.role.color)}"/>`;
}
