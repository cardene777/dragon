/**
 * 量の図の見た目のブロックの原本の形の欠片 (#3560)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 見た目は原本の根の種類の欄 `chart` の `shape` が持ち、骨組み (`schemas/base.schema.json`) がこの形を引く
 */
import type { BlockShape } from "../block";
import { CHART_SHAPES } from "./block";

export const shape: BlockShape = {
  definitions: {
    chartShape: {
      description: "量の図の見た目。donut は項目ごとの割合をドーナツの弧で、bar は項目ごとの量を横棒の長さで描く",
      enum: [...CHART_SHAPES],
    },
  },
};
