/**
 * pick のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    pick: {
      description: "列 box を選ぶ。列の図だけが書ける。列の縁に色が付き、ほかの列が薄くなる",
      type: "object",
      additionalProperties: false,
      required: ["type", "box"],
      properties: {
        type: { const: "pick" },
        box: { $ref: "#/definitions/id" },
      },
    },
  },
};
