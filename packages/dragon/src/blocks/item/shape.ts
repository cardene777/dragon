/**
 * item のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { LABEL_MOST } from "./block";

export const shape: BlockShape = {
  // 列の図のチップと試す図のチップは形が違うので、チップの形は図の種類の決まり (骨組みの `item` の `items`) が選ぶ (#3337)
  field: { type: "array", minItems: 1, description: "チップ。列の図と試す図だけが書け、形は図の種類の決まりが持つ" },
  definitions: {
    item: {
      description: "チップ。color を書かないチップは薄い色で、label を書かないチップは名前を出す。note を書いたチップは図の下の凡例にその説明を出す",
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { $ref: "#/definitions/id" },
        color: { $ref: "#/definitions/color" },
        label: { description: "チップに載せる字", type: "string", minLength: 1, maxLength: LABEL_MOST },
        note: { description: "図の下の凡例に出す、チップの説明", $ref: "#/definitions/text" },
      },
    },
  },
};
