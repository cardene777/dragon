/** 集合の重なりの図の描く部品の組 (#3620、#3656)。並べ方は図の種類の置き場 (`kinds/venn/layout.ts`)、見た目の規則は `render/venn.ts`、円と区画と字の描き方は集まりの円のブロックの置き場が持つ */
import { drawVenn } from "../render/venn";
import type { KindParts } from "./parts";
import { layoutVenn, type VennLayout, vennOverview } from "./venn/layout";

export const parts: KindParts<VennLayout> = {
  // 点で数える見た目 (#3635) は、群れと箱を横に並べられない幅で箱を上に置く
  layout: (diagram, lang, options) => layoutVenn(diagram, lang, options.width),
  draw: (layout, _diagram, ctx) => drawVenn(layout, ctx),
  // 全体図に円を半透明の地で描き、重なった所を元の図と同じく混ざった色に見せる (#3849)
  overview: vennOverview,
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    venn: typeof import("./venn");
  }
}
