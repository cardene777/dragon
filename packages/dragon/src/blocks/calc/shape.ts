/**
 * calc のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    quantity: { description: "数と、省ける単位 (0.05 WETH)", type: "string", pattern: "^[0-9]+(\\.[0-9]+)?( +[^\\s]+)?$" },
  },
  events: {
    calc: {
      description: "box が入る値 in を出る値 out に換算する。両側は数と単位で書き、比率は out を in で割った数。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "in", "out"],
      properties: {
        type: { const: "calc" },
        box: { $ref: "#/definitions/id" },
        in: { $ref: "#/definitions/quantity" },
        out: { $ref: "#/definitions/quantity" },
      },
    },
  },
};
