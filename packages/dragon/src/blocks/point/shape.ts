/**
 * point のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { type: "array", items: { $ref: "#/definitions/point" } },
  definitions: {
    point: {
      description: "節目。at の目盛りの印の下に旗の丸と名札を置く",
      type: "object",
      additionalProperties: false,
      required: ["id", "at"],
      properties: {
        id: { $ref: "#/definitions/id" },
        at: { $ref: "#/definitions/unit" },
      },
    },
  },
};
