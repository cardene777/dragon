/**
 * delete のブロックの原本の形の欠片 (#3632)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    delete: {
      description: "枝を消す。枝分かれの図だけが書ける。消した段から後は枝の札を描かず、どの札からも辿れなくなった commit を点線の丸にする",
      type: "object",
      additionalProperties: false,
      required: ["type", "branch"],
      properties: {
        type: { const: "delete" },
        branch: { $ref: "#/definitions/id" },
      },
    },
  },
};
