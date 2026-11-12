/**
 * 2つの軸で置く図の描く部品の組 (#3622、#3656)。並べ方は図の種類の置き場 (`kinds/matrix/layout.ts`)、区画の描き方は `render/matrix.ts`、
 * 軸の描き方は軸のブロックの置き場、課題の札と置く前の一覧の描き方は課題のブロックの置き場が持つ
 */
import { drawMatrix } from "../render/matrix";
import { layoutMatrix, type MatrixLayout } from "./matrix/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<MatrixLayout> = {
  layout: layoutMatrix,
  draw: (layout, _diagram, ctx) => drawMatrix(layout, ctx),
  // その段で札を受けた区画を見る
  focus: (layout, _diagram, step) => layout.areas.filter((area) => layout.cards.some((card) => card.moves.some((move) => move.step === step && move.area === area.id))),
  overview: (layout) => layout.areas.map((area) => ({ rect: area, band: false, color: area.color })),
};
