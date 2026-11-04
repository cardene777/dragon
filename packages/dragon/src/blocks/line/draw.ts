/**
 * 列の並びの描き方 (#3239、#3351、#3348)。
 *
 * 札の中の空の席は細い枠で描き、封をしている間はチップと一緒に隠す。
 * `line` を書いた段にだけ、札の下に色の縦棒と一言を出す。一言を出す時刻と隠す動きは、列の図を描く部品 (`render/lineup.ts`) が組んで渡す。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupLane, LineupRemark } from "../../kinds/lineup/layout";
import { TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import type { Ctx } from "../../render/parts";
import { cs } from "../color/draw";
import { lines, rect } from "../item/draw";

/** 列 `lane` の空の席の枠。`sealed` は封をしている間にチップと一緒に隠す動き (封の無い列は `undefined`) */
export function slots(lane: LineupLane, sealed: string | undefined, ctx: Ctx): string {
  const rects = lane.slots.map((s) => rect("dg-ln-slot", s, partRadius(ctx.corner, LINEUP_LOOK.chip.radius))).join("");
  return rects === "" ? "" : `<g${sealed ? ` class="dg-a" style="${sealed}"` : ""}>${rects}</g>`;
}

/** 札の下の一言 1 つ。色の縦棒と字で、字は `shown` の間だけ書く */
export function remark(r: LineupRemark, shown: Shown[], ctx: Ctx): string {
  return `<g${r.color ? ` style="${cs(r.color)}"` : ""}>${rect(r.color ? "dg-ln-bar" : "dg-ln-bar0", r.bar, 0)}${lines(ctx, "dg-ln-rk", r.text, TYPE.remark, shown)}</g>`;
}
