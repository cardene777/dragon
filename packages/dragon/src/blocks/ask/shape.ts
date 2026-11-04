/**
 * ask のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    ask: {
      description: "入力の帯の欄の値 values (欄の順) でチップを作って送る。試す図だけが書ける。書き手の例として読み手の送る操作を書く",
      type: "object",
      additionalProperties: false,
      required: ["type", "values"],
      properties: {
        type: { const: "ask" },
        values: { type: "array", minItems: 1, items: { $ref: "#/definitions/text" } },
      },
    },
    item: {
      description: "チップ item の欄の値を values に書き換える。試す図だけが書ける。読み手の書き換えと同じ",
      type: "object",
      additionalProperties: false,
      required: ["type", "item", "values"],
      properties: {
        type: { const: "item" },
        item: { $ref: "#/definitions/id" },
        values: { $ref: "#/definitions/tryValues" },
      },
    },
  },
};
