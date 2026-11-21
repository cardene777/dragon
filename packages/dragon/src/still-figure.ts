/**
 * 頁に止めて置く図の HTML (#3801)。頁の塊 (`page-blocks.ts`) と `dragon embed` (`export/embed.ts`) が共に使う。
 *
 * 属性 `data-still` を持つ塊は、再生の部品を置かず、最後の段の形を描いた SVG に置き換える。
 * SVG は最後の段の形を値として書き込んであり keyframes を持たないので、script が無くても、頁が動きを切っても最後の段の形で止まる (#3812)。
 * 図は自分の幅より広く伸ばさず、枠が狭い時は縦横の比を保って縮める。
 */
import { type RenderOptions, renderDiagram } from "./render/draw";

/** 止めて置く図を選ぶ塊の属性 */
export const STILL_ATTR = "data-still";

/** 止めて置く図を描いた HTML。`div.dragon-figure.dragon-still` の中に SVG を 1 つ置く */
export function stillFigureHtml(diagram: unknown, options: RenderOptions = {}): string {
  const { svg } = renderDiagram(diagram, { ...options, still: true, figure: true });
  return `<div class="dragon-figure dragon-still">${svg.replace("<svg ", '<svg style="display:block;max-width:100%;height:auto" ')}</div>`;
}
