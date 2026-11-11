/**
 * 考えを広げる地図 (#3619) の見た目の規則と、考えと線を組んで描く部品。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 考えと線の描き方は `idea` のブロックの描き方 (`blocks/idea/draw.ts`) が持つ。
 * この file は考えを広げる地図の描く部品 (`kinds/mind.ts`) が出し、見本帳を開いた時に読む塊に入れない。
 * 見た目の規則は考えを広げる地図の SVG にだけ書き、考えを広げる地図だけが使う class に付ける
 */
import { drawIdeas } from "../blocks/idea/draw";
import type { MindLayout } from "../kinds/mind/layout";
import { MIND_LOOK, MIND_TYPE } from "../look/mind";
import { type Ctx, cssFont as font } from "./parts";

const S = MIND_LOOK.stroke;

/** 考えを広げる地図の見た目の規則。線、考えの地と縁、書いた段の太い縁、段の深さごとの名前の字 */
export const MIND_CSS = [
  ".dg-mind-ln{fill:none;stroke:var(--c);stroke-linecap:round;stroke-dasharray:1 1}",
  `.dg-mind-l1{stroke-width:${S.trunk}}`,
  `.dg-mind-l2{stroke-width:${S.twig}}`,
  ".dg-mind-card{fill:var(--surf)}",
  `.dg-mind-ol{fill:none;stroke:var(--c);stroke-width:${S.ring}}`,
  `.dg-mind-o2{stroke-width:${S.leaf}}`,
  `.dg-mind-now{fill:none;stroke:var(--c);stroke-width:${S.now}}`,
  `.dg-mind-t0{${font(MIND_TYPE.centre)};fill:var(--ink)}`,
  `.dg-mind-t1{${font(MIND_TYPE.branch)};fill:var(--ink)}`,
  `.dg-mind-t2{${font(MIND_TYPE.leaf)};fill:var(--ink2)}`,
].join("");

/** 考えを広げる地図の線と考えと、見た目の規則 */
export function drawMind(layout: MindLayout, ctx: Ctx): { base: string; node: string; css: string } {
  return { ...drawIdeas(layout, ctx), css: MIND_CSS };
}
