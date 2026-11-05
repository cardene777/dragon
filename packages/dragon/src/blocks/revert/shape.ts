/**
 * revert のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    revert: {
      description: "いちばん内側で開いている呼び出しの呼ばれた者 box が reason で落ち、その呼び出しの内側の変更が元へ戻る。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box"],
      properties: {
        type: { const: "revert" },
        box: { $ref: "#/definitions/id" },
        reason: { $ref: "#/definitions/text" },
      },
    },
  },
};
