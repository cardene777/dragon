/**
 * idea のブロックの原本の形の欠片 (#3619)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    idea: {
      description: "考えを出す。考えを広げる地図だけが書ける。書いた段で考えが現れ、親 (parent) から考えへの枝の線が引かれる。parent の無い考えが真ん中の題で、color は枝の線と葉の枠に引き継ぐ色",
      type: "object",
      additionalProperties: false,
      required: ["type", "id", "name"],
      properties: {
        type: { const: "idea" },
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        parent: { $ref: "#/definitions/id" },
        color: { $ref: "#/definitions/color" },
      },
    },
  },
};
