/**
 * lifeline のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 版2の原本は生存線の欄を持たず、描く処理の形へ組み直す時に箱の並びから組む (model.ts の toModel)。
 * 時系列図の見た目 (#3720) は原本の根の `sequence` の欄 (`sequenceLook`) が持つ
 */
import { SEQUENCE_SHAPES } from "../../schema";
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    sequenceLook: {
      description: "時系列図の見た目。pipe は生存線を管で描くパイプ図の部品で並べて描き、列の頭の下に値の持ち分 (hold) の器と札を置く。書かない図は今の見た目で描く",
      type: "object",
      additionalProperties: false,
      required: ["shape"],
      properties: {
        shape: { description: "時系列図の見た目の名前", enum: [...SEQUENCE_SHAPES] },
      },
    },
  },
};
