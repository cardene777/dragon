/**
 * 札の描き方 (#3239、#3348)。
 *
 * 札は列の右に傾けて押し、押す段で弾んで出て、最後まで残す。
 * この file は列の図を描く部品 (`render/lineup.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupStamp as StampPlaced } from "../../kinds/lineup/layout";
import { textBox } from "../../layout/measure";
import type { Point } from "../../layout/scene";
import { LOOK, TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { cs } from "../color/draw";
import { rect } from "../item/draw";

/**
 * 列 `lane` の右に押す札 `s`。押す時刻 `at` に弾んで出る。
 * 札の字は、傾けた札の四角の 4 つの角と共に記録する。札の地は下の字を隠すので、崩れの確かめが札に隠れる字を探す (#3631)
 */
export function stamp(s: StampPlaced, lane: string, at: number, ctx: Ctx): string {
  const N = LINEUP_LOOK;
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const baseline = cy + LOOK.baseline.tag;
  // SVG の `rotate` と同じく、図の座標 (下が正) で真ん中の周りに回す
  const turn = (N.stamp.tilt * Math.PI) / 180;
  const square: Point[] = [
    [s.x, s.y],
    [s.x + s.w, s.y],
    [s.x + s.w, s.y + s.h],
    [s.x, s.y + s.h],
  ];
  const corners = square.map(([x, y]): Point => [cx + (x - cx) * Math.cos(turn) - (y - cy) * Math.sin(turn), cy + (x - cx) * Math.sin(turn) + (y - cy) * Math.cos(turn)]);
  ctx.ink.push({ text: s.text, rect: textBox(s.text, cx, baseline, TYPE.stamp, "middle"), shown: [[at, Number.POSITIVE_INFINITY]], cover: corners });
  const text = write(undefined, "dg-ln-st", cx, baseline, s.text, TYPE.stamp, undefined, "middle");
  return `<g class="dg-popc dg-a" data-lineup-stamp="${esc(lane)}" style="${cs(N.stamp.color)};${ctx.m.pop(at)}"><g transform="rotate(${N.stamp.tilt} ${r1(cx)} ${r1(cy)})">${rect("dg-ln-stamp", s, partRadius(ctx.corner, N.stamp.radius))}${text}</g></g>`;
}
