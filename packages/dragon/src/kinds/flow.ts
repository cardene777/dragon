/**
 * 手順の図の描く部品の組 (#3561、#3656)。並べ方は図の種類の置き場 (`kinds/flow/layout.ts`)、線と段の印と箱の字の描き方は `render/flow.ts`、
 * 判断のひし形の描き方は判断のブロックの置き場が持つ
 */
import { drawGauges, gaugeCss } from "../blocks/gauge/draw";
import { gaugesOf } from "../blocks/gauge/layout";
import { flowCss, flowHooks, flowTimes, stepMarks } from "../render/flow";
import { renderScenes } from "../blocks/scene/draw";
import { mountScenes } from "../scene-player";
import { layoutFlow } from "./flow/layout";
import type { KindParts } from "./parts";

export const parts: KindParts = {
  layout: layoutFlow,
  // 段の印の点と運ぶ物と光る間を直す
  times: flowTimes,
  // 判断をひし形で、本筋に無い箱を点線の縁と薄い名前で描き、点が着いた判断を塗る
  hooks: flowHooks,
  // 段で動く線を青で引いて段の印の点を走らせ、段が終わった線を濃い墨の色で残す。
  // 量の目盛り (#3880) は段の印の後に描き、目盛りを持たない図の SVG と動きの名前を変えない
  draw: (layout, diagram, ctx) => ({
    after: () => `${stepMarks(layout, ctx)}${drawGauges(gaugesOf(layout), diagram, ctx)}`,
    css: `${flowCss(ctx.id)}${gaugeCss(gaugesOf(layout))}`,
  }),
  states: true,
  // 場面 (#3878)。段で居場所が移る物を持たないので、全ての場面の段をつないだ 1 つの並べ方から箱の位置を取る
  scenes: { render: (model, options, lang) => renderScenes(model, options, lang, false), mount: mountScenes },
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    flow: typeof import("./flow");
  }
}
