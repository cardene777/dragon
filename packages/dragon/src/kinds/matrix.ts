/**
 * 2つの軸で置く図の描く部品の組 (#3622、#3656)。並べ方は図の種類の置き場 (`kinds/matrix/layout.ts`)、区画の描き方は `render/matrix.ts`、
 * 軸の描き方は軸のブロックの置き場、課題の札と置く前の一覧の描き方は課題のブロックの置き場、点数で点を打つ見た目 (#3637) の描き方は `render/matrix-scatter.ts` が持つ
 */
import { drawMatrix } from "../render/matrix";
import { layoutMatrix, type MatrixLayout, placementsOf } from "./matrix/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<MatrixLayout> = {
  layout: layoutMatrix,
  draw: (layout, _diagram, ctx) => drawMatrix(layout, ctx),
  // その段で課題を受けた区画を見る。区画を書かない line の課題は点数から決まる区画にする
  focus: (layout, diagram, step) => {
    const places = placementsOf(diagram).filter((p) => p.step === step);
    return layout.areas.filter((area) => places.some((p) => p.area === area.id));
  },
  overview: (layout) => layout.areas.map((area) => ({ rect: area, band: false, color: area.color })),
};
