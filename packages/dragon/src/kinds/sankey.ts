/**
 * 量の行き先の図の描く部品の組 (#3626、#3656)。並べ方は図の種類の置き場 (`kinds/sankey/layout.ts`)、見た目の規則は `render/sankey.ts`、
 * 帯と棒と字の描き方は量の帯のブロックの置き場が持つ。
 * 量の札は帯を伸ばし始める時に出てその段の終わりに消える。伸びた帯は残るので札は残さず、回り続ける図と表どうしの関係の図と同じ札の時刻の直しを使う
 */
import { stepCarriers } from "../blocks/carry/step-times";
import { drawSankey } from "../render/sankey";
import type { KindParts } from "./parts";
import { layoutSankey, type SankeyLayout } from "./sankey/layout";

export const parts: KindParts<SankeyLayout> = {
  layout: layoutSankey,
  times: stepCarriers,
  // 出どころと行き先を結ぶ線は帯が描くので、共通の線は描かない
  draw: (layout, _diagram, ctx) => ({ ...drawSankey(layout, ctx), edge: () => undefined }),
};
