/**
 * 量の行き先の図 (`sankey`、#3626) の見た目の規則を描く部品。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 重なりの順は、帯、棒と名前と量、量の札の順にし、札を帯と棒の上に出す。段の番号と量の札は描く所 (`render/draw.ts`) がほかの図の種類と同じく描く。
 * 帯と棒と字の動きは、量の帯のブロックの描き方 (`blocks/band/draw.ts`) が段の時刻から組む。
 * 見た目の規則も量の行き先の図の SVG にだけ書き、ほかの図の SVG と最初に読む script に入れない。
 * この file は後から読む量の行き先の図の塊 (`kinds/sankey.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { drawBands, drawNodes } from "../blocks/band/draw";
import type { SankeyLayout } from "../kinds/sankey/layout";
import { SANKEY_TYPE } from "../look/sankey";
import { type Ctx, cssFont as font } from "./parts";

/** 量の行き先の図の見た目の規則。帯、棒、名前、棒の右の量、棒の上の量 */
const SANKEY_CSS = [
  ".dg-sk-band{fill:none;stroke:var(--c);stroke-linecap:butt;stroke-dasharray:1 2}",
  ".dg-sk-bar{fill:var(--c)}",
  `.dg-sk-name{${font(SANKEY_TYPE.name)};fill:var(--ink)}`,
  `.dg-sk-amt{${font(SANKEY_TYPE.amount)};fill:var(--mute)}`,
  `.dg-sk-lead{${font(SANKEY_TYPE.lead)};fill:var(--ct)}`,
].join("");

/** 量の行き先の図の帯と、その上に重ねる棒と字。帯の上に棒と字を重ね、ほかの層は空なので、帯と棒と字を 1 つの層に入れる。段の番号と量の札は描く所が描く */
export function drawSankey(layout: SankeyLayout, ctx: Ctx): { base: string; css: string } {
  return { base: `<g class="dg-sk">${drawBands(layout, ctx)}</g>${drawNodes(layout, ctx)}`, css: SANKEY_CSS };
}
