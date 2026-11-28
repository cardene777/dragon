/**
 * route のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 網は試す図の部品の 1 つで、原本の形は部品の欄 (blocks.part) の判別で部品の種類ごとの枝を持つ骨組みの部品の形 (definitions.part) が持つ。
 * 選べる図の見た目 (#3873) は網のブロックが確かめるので、原本の根の `try` の欄 (`tryLook`) の形もここに置く
 */
import { TRY_SHAPES } from "../../schema";
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    tryLook: {
      description: "選べる図の見た目。scenes は場面を選ぶとやり取りの順が替わる図で、物を網の 1 本の道の節に、やり取りと答えを blocks.item に書く。書かない図は網と待ち行列で描く",
      type: "object",
      additionalProperties: false,
      required: ["shape"],
      properties: {
        shape: { description: "選べる図の見た目の名前", enum: [...TRY_SHAPES] },
      },
    },
  },
};
