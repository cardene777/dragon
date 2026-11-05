/**
 * emit のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    emit: {
      description: "box がイベント name を出す。args は出した段だけ札に出す引数。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "name"],
      properties: {
        type: { const: "emit" },
        box: { $ref: "#/definitions/id" },
        name: { type: "string", pattern: "^[^\\s(),]+$" },
        args: { type: "array", minItems: 1, items: { $ref: "#/definitions/text" } },
      },
    },
  },
};
