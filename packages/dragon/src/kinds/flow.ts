/**
 * 手順の図の描く部品の組 (#3561、#3656)。並べ方は図の種類の置き場 (`kinds/flow/layout.ts`)、線と段の印と箱の字の描き方は `render/flow.ts`、
 * 判断のひし形の描き方は判断のブロックの置き場が持つ
 */
import { flowCss, flowHooks, flowTimes, stepMarks } from "../render/flow";
import { layoutFlow } from "./flow/layout";
import type { KindParts } from "./parts";

export const parts: KindParts = {
  layout: layoutFlow,
  // 段の印の点と運ぶ物と光る間を直す
  times: flowTimes,
  // 判断をひし形で、本筋に無い箱を点線の縁と薄い名前で描き、点が着いた判断を塗る
  hooks: flowHooks,
  // 段で動く線を青で引いて段の印の点を走らせ、段が終わった線を濃い墨の色で残す
  draw: (layout, _diagram, ctx) => ({ after: () => stepMarks(layout, ctx), css: flowCss(ctx.id) }),
  states: true,
};
