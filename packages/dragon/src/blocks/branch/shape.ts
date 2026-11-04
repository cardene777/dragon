/**
 * branch のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { type: "array", minItems: 1, items: { $ref: "#/definitions/branch" } },
  definitions: {
    branch: {
      description: "枝。帯の左に名札と添え書きを置く",
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: {
        id: { $ref: "#/definitions/id" },
        note: { $ref: "#/definitions/text" },
      },
    },
  },
  events: {
    branch: {
      description: "枝を切る。枝分かれの図だけが書ける。枝の札を from の commit へ置き、HEAD をその枝へ移す",
      type: "object",
      additionalProperties: false,
      required: ["type", "branch", "from"],
      properties: {
        type: { const: "branch" },
        branch: { $ref: "#/definitions/id" },
        from: { $ref: "#/definitions/id" },
      },
    },
  },
};
