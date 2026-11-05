/**
 * return のブロックの原本の形の欠片 (#3389)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  events: {
    call: {
      description:
        "from が to を呼ぶ。value は添えて送る ETH の量、call は呼び出しの種類 (delegate は処理を借り、static は書き込めない)、fold は内側の段を 1 つの箱に畳む印。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "from", "to"],
      properties: {
        type: { const: "call" },
        from: { $ref: "#/definitions/id" },
        to: { $ref: "#/definitions/id" },
        label: { $ref: "#/definitions/text" },
        value: { $ref: "#/definitions/amount" },
        call: { enum: ["delegate", "static"] },
        fold: { const: true },
      },
    },
    return: {
      description: "いちばん内側で開いている呼び出しの呼ばれた者 box が value を返して戻る。一番外の呼び出しが戻ると暫定の変更が全て確定する。配管の図だけが書ける",
      type: "object",
      additionalProperties: false,
      required: ["type", "box"],
      properties: {
        type: { const: "return" },
        box: { $ref: "#/definitions/id" },
        value: { $ref: "#/definitions/text" },
      },
    },
  },
};
