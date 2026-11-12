/**
 * 箱の上限の描き方 (#3624)。
 *
 * ボードは上限の数の目盛りを帯の見出しの 2 行目に並べ、その段の札の数だけ帯の色で塗る。
 * 流れの線は上限を書いた駅だけに、札の席と同じ所へ上限の数の点線の受け口を描き、札の居ない席の受け口だけを見せる。
 * 段ごとに見せる間は、列の図を描く部品 (`render/lineup.ts`) が段の札の数から組んで渡す。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupLane, LineupTick } from "../../kinds/lineup/layout";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import { type Ctx, esc } from "../../render/parts";
import { rect } from "../item/draw";

/** 帯 `lane` の上限の目盛り。下地を全て描き、`on(k)` は左から `k` 番目の目盛りを塗る間だけ見える動き */
export function limitTicks(lane: LineupLane, ticks: LineupTick[], on: (index: number) => string | undefined, ctx: Ctx): string {
  const radius = partRadius(ctx.corner, LINEUP_LOOK.board.tick.h / 2);
  return ticks
    .map((t) => {
      const vis = on(t.index);
      return `${rect("dg-lb-tick", t, radius, ` data-lineup-tick="${esc(lane.id)}"`)}${vis === undefined ? "" : rect("dg-a dg-lb-tickon", t, radius, ` data-lineup-tick-on="${esc(lane.id)}" data-index="${t.index}" style="${vis}"`)}`;
    })
    .join("");
}

/** 駅 `lane` の受け口。`empty(k)` は `k` 番目の席に札が居ない間だけ見える動き */
export function limitSlots(lane: LineupLane, empty: (index: number) => string | undefined): string {
  const S = LINEUP_LOOK.stations;
  return lane.slots
    .map((slot, k) => {
      const vis = empty(k);
      return vis === undefined ? "" : rect("dg-a dg-ls-slot", slot, slot.h / 2, ` data-lineup-slot="${esc(lane.id)}" stroke-dasharray="${S.slotDash.join(" ")}" style="${vis}"`);
    })
    .join("");
}
