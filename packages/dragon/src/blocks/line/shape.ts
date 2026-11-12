/**
 * line のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { LANE_MOST } from "./block";

export const shape: BlockShape = {
  events: {
    line: {
      description:
        "列の図では列 box の並びを items に書き換える。チップは前に居た列から滑り、どの列にも居なかったチップは弾んで現れ、列から外れたチップは消える。items を空にした列の図の line は列を空にする。試す図では、待ち行列 part の中身を items の並びにするか、機械の列 part に items を入れた新しいブロックを足し、items を 1 つ以上書く。列の図と試す図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "items"],
      properties: {
        type: { const: "line" },
        box: { $ref: "#/definitions/id" },
        part: { $ref: "#/definitions/id" },
        items: { type: "array", maxItems: LANE_MOST, items: { $ref: "#/definitions/id" } },
      },
      // 列の図の line は列を空にできる (#3624)。試す図の部品の line は部品へ入れるチップを持つので空にできない
      if: { required: ["part"] },
      then: { properties: { items: { minItems: 1 } } },
    },
  },
};
