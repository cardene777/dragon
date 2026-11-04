/**
 * line のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { LANE_MOST } from "./block";

export const shape: BlockShape = {
  events: {
    line: {
      description: "列の box の並びを items に書き換える。列の図だけが書ける。チップは前に居た列から滑り、どの列にも居なかったチップは弾んで現れ、列から外れたチップは消える",
      type: "object",
      additionalProperties: false,
      required: ["type", "box", "items"],
      properties: {
        type: { const: "line" },
        box: { $ref: "#/definitions/id" },
        items: { type: "array", minItems: 1, maxItems: LANE_MOST, items: { $ref: "#/definitions/id" } },
      },
    },
  },
};
