/**
 * step のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    step: {
      type: "object",
      additionalProperties: false,
      required: ["title", "body", "events"],
      properties: {
        title: { $ref: "#/definitions/text" },
        body: { $ref: "#/definitions/text" },
        code: { $ref: "#/definitions/text" },
        sources: {
          description: "段の出典。読み上げの段の一覧に、名前を URL への link にして書いた順に出す",
          type: "array",
          minItems: 1,
          items: { $ref: "#/definitions/source" },
        },
        gist: { $ref: "#/definitions/gist" },
        events: { type: "array", items: { $ref: "#/definitions/event" } },
      },
    },
  },
};
