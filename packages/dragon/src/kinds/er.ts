/**
 * 表どうしの関係の図の描く部品の組 (#3618、#3656)。並べ方と段で動く物は図の種類の置き場 (`kinds/er/layout.ts`)、見た目の規則は `render/er.ts`、
 * 表と結びの線と式の札の描き方は表のブロックの置き場が持つ。札の時刻の直しは回り続ける図と同じ処理を使う
 */
import { stepCarriers } from "../blocks/carry/step-times";
import { drawEr } from "../render/er";
import { erFocusParts, type ErLayout, layoutEr } from "./er/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<ErLayout> = {
  layout: layoutEr,
  times: stepCarriers,
  // 表どうしを結ぶ線は結びの線が描くので、共通の線は描かない
  draw: (layout, diagram, ctx) => ({ ...drawEr(layout, diagram, ctx), edge: () => undefined }),
  focus: erFocusParts,
};
