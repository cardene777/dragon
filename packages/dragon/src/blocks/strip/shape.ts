/**
 * strip のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { $ref: "#/definitions/strip" },
  definitions: {
    plainStrip: { description: "時間軸の図でない図の中身の帯。物差しを書けない", properties: { meters: { $ref: "#/definitions/absent" } } },
    strip: {
      type: "object",
      additionalProperties: false,
      required: ["title", "fields"],
      properties: {
        title: { $ref: "#/definitions/text" },
        fields: { type: "array", minItems: 1, items: { $ref: "#/definitions/text" } },
        meters: { description: "物差しにする欄。時間軸の図だけが書ける", type: "array", minItems: 1, items: { $ref: "#/definitions/meter" } },
      },
    },
    meter: {
      description: "物差しの欄。line の割合の所に線を引き、set の値まで針と一緒に満ちる",
      type: "object",
      additionalProperties: false,
      required: ["field", "line"],
      properties: { field: { $ref: "#/definitions/text" }, line: { $ref: "#/definitions/ratio" } },
    },
    ratio: { description: "割合。分数 (2/3) か百分率 (97%)", type: "string", pattern: "^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$" },
  },
  events: {
    strip: {
      description: "中身の帯の欄の値と札",
      type: "object",
      additionalProperties: false,
      required: ["type", "field"],
      anyOf: [{ required: ["value"] }, { required: ["tag"] }],
      properties: { type: { const: "strip" }, field: { $ref: "#/definitions/text" }, value: { $ref: "#/definitions/text" }, tag: { $ref: "#/definitions/text" } },
    },
  },
};
