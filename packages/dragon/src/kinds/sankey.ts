/**
 * 量の行き先の図の描く部品 (#3626)。並べ方は図の種類の置き場 (`kinds/sankey/layout.ts`)、時刻と見た目の規則は `render/sankey.ts`、
 * 帯と棒と字の描き方は量の帯のブロックの置き場が持つ
 */
export { layoutSankey } from "./sankey/layout";
export { drawSankey, sankeyTimes } from "../render/sankey";
