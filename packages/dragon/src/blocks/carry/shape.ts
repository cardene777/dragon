/**
 * carry のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    carry: {
      description: "線の上を走る物。封筒 (メッセージや要求)、札 (名前のある値)、硬貨 (価値)、無し",
      type: "object",
      additionalProperties: false,
      required: ["kind"],
      properties: { kind: { enum: ["envelope", "tag", "coin", "none"] }, text: { $ref: "#/definitions/text" } },
      if: { required: ["kind"], properties: { kind: { const: "tag" } } },
      then: { required: ["text"] },
      else: { not: { required: ["text"] } },
    },
  },
};
