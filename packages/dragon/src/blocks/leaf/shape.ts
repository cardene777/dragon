/**
 * leaf のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    leaf: {
      description: "葉を出す。木の図だけが書ける。書いた段で葉の箱が現れる。hash を書くと箱に値を出し、名札を葉の下の札に出す",
      type: "object",
      additionalProperties: false,
      required: ["type", "id"],
      properties: {
        type: { const: "leaf" },
        id: { $ref: "#/definitions/id" },
        hash: { $ref: "#/definitions/hash" },
      },
    },
  },
};
