/**
 * note のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    swap: {
      description: "箱の下の小さな字の書き換え",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "text"],
      properties: {
        type: { const: "swap" },
        box: { $ref: "#/definitions/id" },
        text: { $ref: "#/definitions/text" },
        color: { description: "時間軸の図の節目の丸の色", $ref: "#/definitions/color" },
      },
    },
  },
};
