/** 集合の重なりの図の描く部品の組 (#3620、#3656)。並べ方は図の種類の置き場 (`kinds/venn/layout.ts`)、見た目の規則は `render/venn.ts`、円と区画と字の描き方は集まりの円のブロックの置き場が持つ */
import { drawVenn } from "../render/venn";
import type { KindParts } from "./parts";
import { layoutVenn, type VennLayout } from "./venn/layout";

export const parts: KindParts<VennLayout> = {
  // 点で数える見た目 (#3635) は、群れと箱を横に並べられない幅で箱を上に置く
  layout: (diagram, lang, options) => layoutVenn(diagram, lang, options.width),
  draw: (layout, _diagram, ctx) => drawVenn(layout, ctx),
};
