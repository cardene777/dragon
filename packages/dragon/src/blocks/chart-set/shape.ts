/**
 * 量の図の値のブロックの原本の形の欠片 (#3560)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    set: {
      description: "量の図の項目 item の値を value にする。量の図だけが書け、値は 0 以上の数",
      type: "object",
      additionalProperties: false,
      required: ["type", "item", "value"],
      properties: {
        type: { const: "set" },
        item: { $ref: "#/definitions/id" },
        value: { description: "項目の値。単位を持たない 0 以上の数", type: "number", minimum: 0 },
      },
    },
  },
};
