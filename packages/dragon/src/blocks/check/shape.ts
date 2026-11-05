/**
 * check のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    check: {
      description: "box が left と right を op で比べる。両側が数なら dragon が比べ、数でない確認は fail を書いた時だけ落ちる。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "left", "op", "right"],
      properties: {
        type: { const: "check" },
        box: { $ref: "#/definitions/id" },
        left: { $ref: "#/definitions/text" },
        op: { enum: [">=", "<=", "==", "!=", ">", "<"] },
        right: { $ref: "#/definitions/text" },
        fail: { const: true },
      },
    },
  },
};
