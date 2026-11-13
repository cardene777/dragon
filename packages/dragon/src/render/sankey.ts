/**
 * 量の行き先の図 (`sankey`、#3626) の見た目の規則を描く部品。見た目の元は step 2 で本人が選んだ動く試作の案A。
 *
 * 重なりの順は、帯、棒と名前と量、量の札の順にし、札を帯と棒の上に出す。段の番号と量の札は描く所 (`render/draw.ts`) がほかの図の種類と同じく描く。
 * 帯と棒と字の動きは、量の帯のブロックの描き方 (`blocks/band/draw.ts`) が段の時刻から組む。
 * 見た目の規則も量の行き先の図の SVG にだけ書き、ほかの図の SVG と最初に読む script に入れない。
 * この file は後から読む量の行き先の図の塊 (`kinds/sankey.ts`) だけが読み、見本帳を開いた時に読む塊に入れない
 */
import { drawBands, drawNodes, drawRows, drawTreemap } from "../blocks/band/draw";
import type { SankeyLayout } from "../kinds/sankey/layout";
import { SANKEY_ROWS, SANKEY_ROWS_TYPE, SANKEY_TREEMAP, SANKEY_TREEMAP_TYPE, SANKEY_TYPE } from "../look/sankey";
import { type Ctx, cssFont as font } from "./parts";

/** 量の行き先の図の見た目の規則。帯、棒、名前、棒の右の量、棒の上の量 */
const SANKEY_CSS = [
  ".dg-sk-band{fill:none;stroke:var(--c);stroke-linecap:butt;stroke-dasharray:1 2}",
  ".dg-sk-bar{fill:var(--c)}",
  `.dg-sk-name{${font(SANKEY_TYPE.name)};fill:var(--ink)}`,
  `.dg-sk-amt{${font(SANKEY_TYPE.amount)};fill:var(--mute)}`,
  `.dg-sk-lead{${font(SANKEY_TYPE.lead)};fill:var(--ct)}`,
].join("");

/**
 * 段ごとの帯の見た目 (`[shape: rows]`、#3641) の見た目の規則。区画の地、下りる帯、帯の下の名前の色の印、区画の名前、区画の量、残りの量、帯の下の名前。
 * 区画の地の濃さは、新しく分かれた区画、続いている区画、残りで分ける。帯の図の SVG には書かない
 */
const ROWS_CSS = [
  ".dg-sk-cell{fill:var(--c)}",
  `.dg-sk-new{fill-opacity:${SANKEY_ROWS.tint.now}}`,
  `.dg-sk-carried{fill-opacity:${SANKEY_ROWS.tint.carried}}`,
  `.dg-sk-rest{fill-opacity:${SANKEY_ROWS.tint.rest}}`,
  `.dg-sk-drop{fill:var(--c);fill-opacity:${SANKEY_ROWS.tint.drop}}`,
  ".dg-sk-mark{fill:var(--c)}",
  `.dg-sk-rname{${font(SANKEY_ROWS_TYPE.name)};fill:var(--ink)}`,
  `.dg-sk-rval{${font(SANKEY_ROWS_TYPE.value)};fill:var(--ct)}`,
  `.dg-sk-rrest{${font(SANKEY_ROWS_TYPE.rest)};fill:var(--mute)}`,
  `.dg-sk-rlist{${font(SANKEY_ROWS_TYPE.list)};fill:var(--ink)}`,
].join("");

/**
 * 面積で割る四角の見た目 (`[shape: treemap]`、#3642) の見た目の規則。区画の地、残りの地、子の区画に分けた区画の枠、切る線、図の四角の下の名前の色の印、
 * 区画の名前、区画の量、残りの量、名前の札、図の四角の下の名前。帯の図の SVG には書かない
 */
const TREEMAP_CSS = [
  `.dg-sk-tile{fill:var(--c);fill-opacity:${SANKEY_TREEMAP.tint.now}}`,
  `.dg-sk-trest{fill:var(--c);fill-opacity:${SANKEY_TREEMAP.tint.rest}}`,
  `.dg-sk-frame{fill:none;stroke:var(--c);stroke-width:${SANKEY_TREEMAP.nest.stroke}}`,
  `.dg-sk-cut{fill:none;stroke:var(--ink);stroke-width:${SANKEY_TREEMAP.cut.width};stroke-linecap:butt;stroke-dasharray:1 2}`,
  ".dg-sk-mark{fill:var(--c)}",
  `.dg-sk-tname{${font(SANKEY_TREEMAP_TYPE.name)};fill:var(--ink)}`,
  `.dg-sk-tval{${font(SANKEY_TREEMAP_TYPE.value)};fill:var(--ct)}`,
  `.dg-sk-trest-v{${font(SANKEY_TREEMAP_TYPE.rest)};fill:var(--mute)}`,
  `.dg-sk-tchip{${font(SANKEY_TREEMAP_TYPE.chip)};fill:var(--ct)}`,
  `.dg-sk-tlist{${font(SANKEY_TREEMAP_TYPE.list)};fill:var(--ink)}`,
].join("");

/**
 * 量の行き先の図の帯と、その上に重ねる棒と字。帯の上に棒と字を重ね、ほかの層は空なので、帯と棒と字を 1 つの層に入れる。段の番号と量の札は描く所が描く。
 * 段ごとの帯の見た目は、下りる帯と行を 1 つの層に入れ、帯の図の見た目の規則に段ごとの帯の規則を足す。
 * 面積で割る四角の見た目は、区画と切る線と図の四角の下の名前を 1 つの層に入れ、帯の図の見た目の規則に面積で割る四角の規則を足す
 */
export function drawSankey(layout: SankeyLayout, ctx: Ctx): { base: string; css: string } {
  if (layout.arrangement === "rows") return { base: `<g class="dg-sk">${drawRows(layout, ctx)}</g>`, css: SANKEY_CSS + ROWS_CSS };
  if (layout.arrangement === "treemap") return { base: `<g class="dg-sk">${drawTreemap(layout, ctx)}</g>`, css: SANKEY_CSS + TREEMAP_CSS };
  return { base: `<g class="dg-sk">${drawBands(layout, ctx)}</g>${drawNodes(layout, ctx)}`, css: SANKEY_CSS };
}
