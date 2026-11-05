/**
 * write のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    write: {
      description: "box が値 name を value に書き替える。書き替わる札の持ち主は開いている呼び出しから決まる。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "name", "value"],
      properties: {
        type: { const: "write" },
        box: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        value: { $ref: "#/definitions/text" },
      },
    },
  },
};
