/**
 * 頁に止めて置く図の HTML (#3801)。頁の塊 (`page-blocks.ts`) と `dragon embed` (`export/embed.ts`) が共に使う。
 *
 * 属性 `data-still` を持つ塊は、再生の部品を置かず、最後の段の形を描いた SVG に置き換える。
 * SVG は最後の段の形を値として書き込んであり keyframes を持たないので、script が無くても、頁が動きを切っても最後の段の形で止まる (#3812)。
 * 図は自分の幅より広く伸ばさず、枠が狭い時は縦横の比を保って縮める。
 */
import { PALETTES } from "./look/values";
import { type RenderOptions, renderDiagram } from "./render/draw";

/** 止めて置く図を選ぶ塊の属性 */
export const STILL_ATTR = "data-still";

/** 止めて置く図で、飛び先 (`link:`) がこの属性の値の箱だけに色を残す塊の属性 (#3991) */
export const FOCUS_ATTR = "data-focus";

/**
 * 止めて置く図を描く色味を名指す塊の属性 (#4057)。名指さない塊は頁の白い地に馴染む澄んだ色味 (`clear`) で描く。
 * 説明の頁 (`layout: guide`) の話題の頭の地図は、頁の他の図と同じ紙と墨 (`paper`) を名指す
 */
export const PALETTE_ATTR = "data-palette";

/** 属性の値が色味の名前ならその名前。色味に無い名前と、属性が無い時は `undefined` で、名指さない時と同じ澄んだ色味で描く */
export const stillPalette = (value: string | null | undefined): string | undefined =>
  value !== null && value !== undefined && Object.hasOwn(PALETTES, value) ? value : undefined;

/** 止めて置く図を描いた HTML。`div.dragon-figure.dragon-still` の中に SVG を 1 つ置く */
export function stillFigureHtml(diagram: unknown, options: RenderOptions = {}): string {
  const { svg, layout } = renderDiagram(diagram, { ...options, still: true, figure: true });
  // 全ての図に入る `.dg{width:100%}` は枠の幅まで拡げるので、元の幅を上限にして真ん中に置く (#3934)
  const style = `display:block;max-width:min(100%,${Math.ceil(layout.width)}px);height:auto;margin-inline:auto`;
  return `<div class="dragon-figure dragon-still">${svg.replace("<svg ", `<svg style="${style}" `)}</div>`;
}
