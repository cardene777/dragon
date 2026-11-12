/** 集合の重なりの図の描く部品の組 (#3620、#3656)。並べ方は図の種類の置き場 (`kinds/venn/layout.ts`)、見た目の規則は `render/venn.ts`、円と区画と字の描き方は集まりの円のブロックの置き場が持つ */
import { drawVenn } from "../render/venn";
import type { KindParts } from "./parts";
import { layoutVenn, type VennLayout } from "./venn/layout";

export const parts: KindParts<VennLayout> = {
  layout: layoutVenn,
  draw: (layout, _diagram, ctx) => drawVenn(layout, ctx),
};
