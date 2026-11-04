/**
 * role のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { type: "array", minItems: 1, items: { $ref: "#/definitions/role" } },
  definitions: {
    role: {
      description: "役。チップを持たずに動く者で、箱の上に札として並び、段の中の role の出来事で光る",
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { $ref: "#/definitions/id" },
        note: { description: "役の札の名前の下の一言", $ref: "#/definitions/text" },
      },
    },
  },
  events: {
    role: {
      description: "この段で役 role が動く。列の図だけが書ける。役の札の縁が光る",
      type: "object",
      additionalProperties: false,
      required: ["type", "role"],
      properties: {
        type: { const: "role" },
        role: { $ref: "#/definitions/id" },
      },
    },
  },
};
