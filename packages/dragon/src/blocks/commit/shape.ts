/**
 * commit のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    commit: {
      description: "commit を積む。枝分かれの図だけが書ける。積んだ枝の札と、その枝を指す HEAD が進む。当て直し (copy) は枝の札を動かさず、merge commit (merge) は取り込む枝の先端も親に持つ",
      type: "object",
      additionalProperties: false,
      required: ["type", "id", "branch"],
      properties: {
        type: { const: "commit" },
        id: { $ref: "#/definitions/id" },
        branch: { $ref: "#/definitions/id" },
        copy: { $ref: "#/definitions/id" },
        merge: { $ref: "#/definitions/id" },
        hash: { $ref: "#/definitions/hash" },
        note: { $ref: "#/definitions/text" },
      },
    },
  },
};
