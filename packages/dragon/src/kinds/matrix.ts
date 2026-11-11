/**
 * 2つの軸で置く図の描く部品 (#3622)。並べ方は図の種類の置き場 (`kinds/matrix/layout.ts`)、区画の描き方は `render/matrix.ts`、
 * 軸の描き方は軸のブロックの置き場、課題の札と置く前の一覧の描き方は課題のブロックの置き場が持つ
 */
export { layoutMatrix } from "./matrix/layout";
export { drawMatrix } from "../render/matrix";
