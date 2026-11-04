/**
 * scale のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  field: { $ref: "#/definitions/scale" },
  definitions: {
    scale: {
      description: "目盛り。unit の名前の目盛りを length の長さで count 個並べ、最初の目盛りの番号を from にする",
      type: "object",
      additionalProperties: false,
      required: ["unit", "length", "count"],
      properties: {
        unit: { $ref: "#/definitions/text" },
        length: { $ref: "#/definitions/duration" },
        count: { type: "integer", minimum: 1 },
        from: { type: "integer", minimum: 0 },
      },
    },
    duration: {
      description: "長さ。数と単位 (ms、s、min、h、d) の組",
      type: "string",
      pattern: "^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$",
    },
    period: {
      description: "区切り。目盛り length 個ごとに name の区切りを置き、最初の区切りの番号を from にする",
      type: "object",
      additionalProperties: false,
      required: ["name", "length"],
      properties: {
        name: { $ref: "#/definitions/text" },
        length: { type: "integer", minimum: 1 },
        from: { type: "integer", minimum: 0 },
      },
    },
  },
  events: {
    now: {
      description: "時間軸の図の今の時刻の針を、to の目盛りの終わりまで進める",
      type: "object",
      additionalProperties: false,
      required: ["type", "to"],
      properties: {
        type: { const: "now" },
        to: { $ref: "#/definitions/unit" },
      },
    },
    span: {
      description: "時間軸の図の from から to の目盛りに、括弧と字を出す。shape が box なら印の列を囲み、字を縁の札にする",
      type: "object",
      additionalProperties: false,
      required: ["type", "from", "to", "text"],
      properties: {
        type: { const: "span" },
        from: { $ref: "#/definitions/unit" },
        to: { $ref: "#/definitions/unit" },
        text: { $ref: "#/definitions/text" },
        shape: { enum: ["box"] },
        color: { $ref: "#/definitions/color" },
      },
    },
  },
};
