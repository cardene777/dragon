/**
 * box のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { LANE_MOST } from "../line/block";

export const shape: BlockShape = {
  field: { type: "array", items: { $ref: "#/definitions/box" } },
  definitions: {
    box: {
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        sub: { $ref: "#/definitions/text" },
        color: { $ref: "#/definitions/color" },
        icon: { $ref: "#/definitions/iconField" },
        region: { $ref: "#/definitions/id" },
        link: { description: "飛び先。描いた図ではこの箱がここへの link になる", $ref: "#/definitions/url" },
        block: { description: "使う人が足した、箱を元にしたブロックの名前。形と色はその定義から読む", $ref: "#/definitions/userBlockName" },
        order: {
          description: "列の図の箱の並べ方。none は順番の無い置き場で、チップを格子に並べる。書かない箱は上から実行する札で、チップを line に書いた順に積む",
          enum: ["none"],
        },
        limit: {
          description: `列の図の箱に並べられる札の数の上限。1 から ${LANE_MOST} までの整数で、line がこの数を超える札を並べられない。層の見た目 (layers) の箱には書けない`,
          type: "integer",
          minimum: 1,
          maximum: LANE_MOST,
        },
      },
    },
  },
};
