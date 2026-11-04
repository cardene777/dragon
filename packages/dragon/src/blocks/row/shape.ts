/**
 * row のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { type: "array", minItems: 1, items: { $ref: "#/definitions/row" } },
  definitions: {
    row: {
      description: "印の列。目盛りごとに印を 1 つ置き、empty の目盛りは空きの印にする",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        color: { $ref: "#/definitions/color" },
        empty: { type: "array", items: { $ref: "#/definitions/unit" } },
      },
    },
  },
  events: {
    mark: {
      description: "時間軸の図の印の列 row の、from から to の目盛りの印の色を変える",
      type: "object",
      additionalProperties: false,
      required: ["type", "row", "from", "to", "color"],
      properties: {
        type: { const: "mark" },
        row: { $ref: "#/definitions/id" },
        from: { $ref: "#/definitions/unit" },
        to: { $ref: "#/definitions/unit" },
        color: { $ref: "#/definitions/color" },
      },
    },
  },
};
