/**
 * 置き場の描き方 (#3351、#3348、#3624)。
 *
 * 順番の無い置き場 (`order: none`) は、ボードの帯の見出しの 2 行目と流れの線の駅の名前の下に、点線で囲んだ「順番なし」の札を出す。
 * 置き場の札は番号を持たない。札を描くのは札のブロック (`blocks/item/draw.ts`)。
 * この file は列の図を描く部品 (`render/lineup.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupLane } from "../../kinds/lineup/layout";
import { LINEUP_LOOK } from "../../look/lineup";
import type { TextStyle } from "../../look/values";
import { partRadius } from "../../render/corner";
import type { Ctx } from "../../render/parts";
import { lines, rect } from "../item/draw";

/** 置き場 `lane` の「順番なし」の札。置き場でない帯は空 */
export function noOrderPill(lane: LineupLane, style: TextStyle, ctx: Ctx): string {
  if (!lane.hint || !lane.hintBox) return "";
  const B = LINEUP_LOOK.board;
  const pill = rect("dg-lb-noorder", lane.hintBox, partRadius(ctx.corner, lane.hintBox.h / 2), ` stroke-dasharray="${B.noOrder.dash.join(" ")}"`);
  return `<g data-lineup-hint="">${pill}${lines(ctx, "dg-lb-not", lane.hint, style)}</g>`;
}
