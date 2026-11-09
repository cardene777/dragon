/**
 * task のブロックの原本の形の欠片 (#3562)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { type: "array", minItems: 1, items: { $ref: "#/definitions/task" } },
  definitions: {
    task: {
      description: "作業。from から to の目盛りの上に続いた棒を引き、行の左に name を書く。after は直前に宣言した印の列の名札",
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "from", "to"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        from: { $ref: "#/definitions/unit" },
        to: { $ref: "#/definitions/unit" },
        color: { $ref: "#/definitions/color" },
        after: { $ref: "#/definitions/id" },
      },
    },
  },
};
