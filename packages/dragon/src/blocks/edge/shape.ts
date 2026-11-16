/**
 * edge のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    edge: {
      description: "線。運ぶ物を載せて送る側から受ける側へ走る",
      type: "object",
      additionalProperties: false,
      required: ["type", "from", "to", "carry"],
      properties: {
        type: { const: "edge" },
        from: { $ref: "#/definitions/id" },
        to: { $ref: "#/definitions/id" },
        label: { $ref: "#/definitions/text" },
        carry: { $ref: "#/definitions/carry" },
        labelSide: { description: "線の名前を置く側 (寄せの指示)", enum: ["above", "below", "left", "right"] },
        at: { description: "時間軸の図の拡大の帯で、線を引く列の目盛り", $ref: "#/definitions/unit" },
        into: { description: "時間軸の図の拡大の帯で、受ける箱を選ぶ列の目盛り。書かなければ at の列", $ref: "#/definitions/unit" },
        block: { description: "使う人が足した、線を元にしたブロックの名前。線の形と色はその定義から読む", $ref: "#/definitions/userBlockName" },
      },
    },
  },
};
