/**
 * band のブロックの原本の形の欠片 (#3626)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 量の帯は箱と線から並べ、原本の blocks に帯の欄は無い。箱の数の決まりは図の種類ごとの決まりと一緒に骨組み (`schemas/base.schema.json`) が持つ。
 * 段ごとの帯の見た目 (#3641) は原本の根の `sankey` の欄 (`sankeyLook`) が持つ
 */
import type { BlockShape } from "../block";
import { SANKEY_SHAPES } from "./limits";

export const shape: BlockShape = {
  definitions: {
    sankeyLook: {
      description: "量の行き先の図の見た目。rows は段ごとに図の幅いっぱいの帯を1行ずつ上から積み、各行をその段までの線で分かれた区画に分ける",
      type: "object",
      additionalProperties: false,
      required: ["shape"],
      properties: {
        shape: { description: "量の行き先の図の見た目の名前", enum: [...SANKEY_SHAPES] },
      },
    },
  },
};
