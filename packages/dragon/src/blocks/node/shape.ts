/**
 * node のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    node: {
      description: "1 つ以上の子から親を組む。木の図だけが書ける。書いた段で親の箱と、子から親への木の線が現れる",
      type: "object",
      additionalProperties: false,
      required: ["type", "id", "children"],
      properties: {
        type: { const: "node" },
        id: { $ref: "#/definitions/id" },
        children: { type: "array", minItems: 1, items: { $ref: "#/definitions/id" } },
        hash: { $ref: "#/definitions/hash" },
      },
    },
  },
};
