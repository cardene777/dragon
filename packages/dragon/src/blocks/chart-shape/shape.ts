/**
 * 量の図の見た目のブロックの原本の形の欠片 (#3560)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 見た目は原本の根の種類の欄 `chart` の `shape` が持ち、骨組み (`schemas/base.schema.json`) がこの形を引く。
 * 点で数える見た目 (#3635) の 1 点の件数 (`dotUnit`) と、集合の重なりの図の根の `venn` の欄の形 (`vennLook`) もここに持つ
 */
import type { BlockShape } from "../block";
import { CHART_SHAPES, VENN_SHAPES } from "./block";

export const shape: BlockShape = {
  definitions: {
    chartShape: {
      description:
        "量の図の見た目。donut は項目ごとの割合をドーナツの弧で、bar は項目ごとの量を横棒の長さで、funnel は段ごとに減る項目の量を漏斗の横棒で、dots は項目ごとの件数を点の数で描く",
      enum: [...CHART_SHAPES],
    },
    dotUnit: {
      description: "点で数える見た目 (dots) の 1 点の件数。0 より大きい数で、書かなければ全体が最も大きい段で点が 100 個に近くなる 1 か 2 か 5 に 10 の累乗を掛けた数を選ぶ",
      type: "number",
      exclusiveMinimum: 0,
    },
    vennLook: {
      description: "集合の重なりの図の見た目。dots は区画ごとの件数を点の数で数え、全体の箱から区画の群れへ点を寄せる",
      type: "object",
      additionalProperties: false,
      required: ["shape"],
      properties: {
        shape: { description: "集合の重なりの図の見た目の名前", enum: [...VENN_SHAPES] },
        unit: { $ref: "#/definitions/dotUnit" },
      },
    },
  },
};
