/**
 * 回り続ける図の描く部品の組 (#3623、#3656)。並べ方は図の種類の置き場 (`kinds/cycle/layout.ts`)、輪の真ん中の字の描き方は `render/cycle.ts`、
 * 隣どうしの手順を結ぶ弧の描き方は輪のブロックの置き場が持つ。札の時刻の直しは表どうしの関係の図と同じ処理を使う
 */
import { stepCarriers } from "../blocks/carry/step-times";
import { drawCycle } from "../render/cycle";
import { type CycleLayout, layoutCycle } from "./cycle/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<CycleLayout> = {
  layout: layoutCycle,
  times: stepCarriers,
  // 手順を結ぶ線は弧が描くので、共通の線は描かない
  draw: (layout, diagram, ctx) => ({ ...drawCycle(layout, diagram, ctx), edge: () => undefined }),
};
