/**
 * 表どうしの関係の図の描く部品 (#3618)。並べ方は図の種類の置き場 (`kinds/er/layout.ts`)、時刻と見た目の規則は `render/er.ts`、
 * 表と結びの線と式の札の描き方は表のブロックの置き場が持つ
 */
export { erFocusParts, layoutEr } from "./er/layout";
export { drawEr, erTimes } from "../render/er";
