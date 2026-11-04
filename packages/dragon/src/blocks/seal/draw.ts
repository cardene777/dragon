/**
 * 封の描き方 (#3239、#3348)。
 *
 * 封は斜線と錠と字で描き、箱の左から右へ伸び、覆い終えた時に箱のチップを隠す。開ける時はチップを出してから封を消す。
 * 斜線の模様は図ごとに 1 つ置き、封の地が名前で引く。伸びて消える動きと、チップを隠す動きは、列の図を描く部品 (`render/lineup.ts`) が組んで渡す。
 * この file は列の図を描く部品だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import type { LineupSeal } from "../../kinds/lineup/layout";
import { TYPE } from "../../look/values";
import { LINEUP_LOOK } from "../../look/lineup";
import { partRadius } from "../../render/corner";
import type { Shown } from "../../render/ink";
import { type Ctx, esc, r1, write } from "../../render/parts";
import { rect } from "../item/draw";

/** 封の斜線の模様。図ごとに 1 つ置き、封の地が `dg-seal-<図の id>` の名前で引く */
export function sealPattern(ctx: Ctx): string {
  const stripes = LINEUP_LOOK.seal.stripe;
  return `<defs><pattern id="dg-seal-${ctx.id}" patternUnits="userSpaceOnUse" width="${stripes * 2}" height="${stripes * 2}" patternTransform="rotate(45)"><rect class="dg-ln-sl" width="${stripes * 2}" height="${stripes * 2}"/><rect class="dg-ln-sd" width="${stripes}" height="${stripes * 2}"/></pattern></defs>`;
}

/** 封の真ん中の錠の箱と錠と字。字は封が箱を隠す間 `closed` だけ書く */
function lock(s: LineupSeal, word: string, closed: Shown, ctx: Ctx): string {
  const N = LINEUP_LOOK;
  const size = Math.min(N.seal.lock, s.h - N.seal.over * 2, s.w - N.seal.over * 2);
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const { w, h, r, rise } = N.lock;
  const top = cy + N.seal.lockY - h / 2;
  const shackle = `M${r1(cx - r)} ${r1(top)}v${-rise}a${r} ${r} 0 0 1 ${r * 2} 0v${rise}`;
  const text = write(ctx.ink, "dg-ln-sw-t", cx, cy + N.seal.wordY, word, TYPE.sealWord, [closed], "middle");
  return (
    `<g data-lineup-lock="">${rect("dg-ln-lockbox", { x: cx - size / 2, y: cy - size / 2, w: size, h: size }, partRadius(ctx.corner, N.chip.radius))}` +
    `<path class="dg-ln-lock" d="${shackle}"/>${rect("dg-ln-lock", { x: cx - w / 2, y: top, w, h }, partRadius(ctx.corner, N.chip.radius) / 2)}</g>${text}`
  );
}

/** 列 `lane` の封 `s` 1 つ。`kf` は伸びて消える動き、`word` は封の字、`closed` は封が箱を隠す間 */
export function sealCover(s: LineupSeal, lane: string, kf: string, word: string, closed: Shown, ctx: Ctx): string {
  return `<g class="dg-ln-seal dg-a" data-lineup-seal="${esc(lane)}" style="${kf}">${rect("dg-ln-sealbg", s, partRadius(ctx.corner, LINEUP_LOOK.seal.radius), ` fill="url(#dg-seal-${ctx.id})"`)}${lock(s, word, closed, ctx)}</g>`;
}
