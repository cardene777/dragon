/**
 * side のブロックの原本の形の欠片 (#3429)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: {
    description: "試す図の、同じ行に左から並べる部品の名札の組 (side の行、#3429)。1 つの組は 2 つ以上の部品を持つ",
    type: "array",
    minItems: 1,
    items: { type: "array", minItems: 2, items: { $ref: "#/definitions/id" } },
  },
};
