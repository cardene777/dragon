/**
 * 量の目盛りのブロックの原本の形の欠片 (#3880)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { type: "array", minItems: 1, items: { $ref: "#/definitions/gauge" } },
  definitions: {
    gauge: {
      description: "量の目盛り。on の箱のすぐ下か、on を書かない時は図の上の帯に、宣言した順に縦に積む",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        on: { description: "目盛りを置く箱の名札", $ref: "#/definitions/id" },
        limit: { description: "上限。書かない目盛りは棒を描かず、値と単位だけを出す", type: "number", exclusiveMinimum: 0 },
        unit: { description: "値の後ろに出す単位", $ref: "#/definitions/text" },
        over: { description: "上限を超えた段に目盛りの下に出す札の字。limit を書いた目盛りだけが持てる", $ref: "#/definitions/text" },
      },
      if: { required: ["over"] },
      then: { required: ["limit"] },
    },
  },
  events: {
    gauge: {
      description: "目盛り gauge の値を value にする。hold を持たない時は値がその段の総量で、持つ時は value が確定した量、hold が予約した量で、総量は 2 つの合計。書かない段は前の段の値を保つ",
      type: "object",
      additionalProperties: false,
      required: ["type", "gauge", "value"],
      properties: {
        type: { const: "gauge" },
        gauge: { $ref: "#/definitions/id" },
        value: { description: "その段の総量。hold を持つ時は確定した量。0 以上の数", type: "number", minimum: 0 },
        hold: { description: "その段の予約した量。確定した量に続けて淡い色で塗る。0 以上の数", type: "number", minimum: 0 },
      },
    },
  },
};
