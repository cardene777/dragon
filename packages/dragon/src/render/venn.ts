/**
 * 集合の重なりの図 (`venn`、#3620) を描く部品。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 重なりの順は、どれにも入らない数の枠、集まりの円、光らせた区画、区画の数、円の外の名前と数、重なりの数の札の順にし、札と字を円の線の上に出す。
 * 段の番号は描く所 (`render/draw.ts`) がほかの図の種類と同じく描く。円と区画と字の動きは、集まりの円のブロックの描き方 (`blocks/circle/draw.ts`) が段の時刻から組む。
 * 見た目の規則も集合の重なりの図の SVG にだけ書き、ほかの図の SVG と最初に読む script に入れない。
 * この file は後から読む集合の重なりの図の塊 (`kinds/venn.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { drawChips, drawCircles, drawLits, drawNone, drawRegions } from "../blocks/circle/draw";
import type { VennLayout } from "../kinds/venn/layout";
import { VENN_LOOK, VENN_TYPE } from "../look/venn";
import { DOTS_CSS, drawDots } from "./dots";
import { type Ctx, cssFont as font } from "./parts";

const C = VENN_LOOK.circle;
const K = VENN_LOOK.chip;
const F = VENN_LOOK.frame;

/** 集合の重なりの図の見た目の規則。円、光らせた区画、名前と数、区画の数、札と点線、どれにも入らない数の枠 */
const VENN_CSS = [
  `.dg-vn-c{fill:var(--c);fill-opacity:${C.fill};stroke:var(--c);stroke-width:${C.stroke}}`,
  `.dg-vn-lit{fill:var(--c);fill-opacity:${VENN_LOOK.lit}}`,
  `.dg-vn-name{${font(VENN_TYPE.name)};fill:var(--ct)}`,
  `.dg-vn-total{${font(VENN_TYPE.total)};fill:var(--ink2)}`,
  `.dg-vn-n{${font(VENN_TYPE.region)};fill:var(--ink)}`,
  `.dg-vn-chip{fill:var(--surf);stroke:var(--c);stroke-width:${K.stroke}}`,
  `.dg-vn-ct{${font(VENN_TYPE.chip)};fill:var(--ct)}`,
  `.dg-vn-lead{fill:none;stroke:var(--c);stroke-width:${K.lead};stroke-dasharray:${K.dash} ${K.dash}}`,
  `.dg-vn-frame{fill:var(--c);fill-opacity:${F.fill};stroke:var(--c);stroke-width:${F.stroke}}`,
].join("");

/** 集合の重なりの図を描く。段の番号の丸は描く所が描く。点で数える見た目 (#3635) は点で数える見た目の部品 (`render/dots.ts`) が描く */
export function drawVenn(layout: VennLayout, ctx: Ctx): { base: string; css: string } {
  const plan = layout.venn;
  if (plan.dots) return { base: `<g class="dg-vn">${drawDots(plan.dots, ctx)}</g>`, css: DOTS_CSS };
  const { defs, circles, labels } = drawCircles(plan, ctx);
  const body = `${defs}${drawNone(plan, ctx)}${circles}${drawLits(plan, ctx)}${drawRegions(plan, ctx)}${labels}${drawChips(plan, ctx)}`;
  return { base: `<g class="dg-vn">${body}</g>`, css: VENN_CSS };
}
