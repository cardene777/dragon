/**
 * 量の図の項目のブロックの原本の形の欠片 (#3560)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 量の図の見た目と項目は原本の根の種類の欄 `chart` が持ち、骨組み (`schemas/base.schema.json`) がこの形を引く
 */
import type { BlockShape } from "../block";
import { CHART_ITEMS_MOST } from "./block";

export const shape: BlockShape = {
  definitions: {
    chart: {
      type: "object",
      additionalProperties: false,
      required: ["shape", "items"],
      properties: {
        shape: { $ref: "#/definitions/chartShape" },
        items: {
          description: "比べる項目。宣言した順に、ドーナツは 12 時の向きから時計回りに、横棒は上から並べる",
          type: "array",
          minItems: 1,
          maxItems: CHART_ITEMS_MOST,
          items: { $ref: "#/definitions/chartItem" },
        },
      },
    },
    chartItem: {
      description: "量の図の項目。name は凡例と棒の左に出す名前で、color を書かない項目は宣言した順に色の役を配る",
      type: "object",
      additionalProperties: false,
      required: ["id", "name"],
      properties: {
        id: { $ref: "#/definitions/id" },
        name: { $ref: "#/definitions/text" },
        color: { $ref: "#/definitions/color" },
      },
    },
  },
};
