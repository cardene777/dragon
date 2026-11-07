/**
 * gist のブロックの原本の形の欠片 (#3464)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 * 段の欄 `gist` の形で、段の形 (段のブロックの `step`) がこの形を引く。配管の図でない図の段は、骨組み (`schemas/base.schema.json`) が欄を持たせない
 */
import type { BlockShape } from "../block";

export const shape: BlockShape = {
  definitions: {
    gist: {
      description: "段の要点。配管の図だけが書け、図の下の段の矢印の後ろの要点の札と、読み上げの段の一覧に出す",
      type: "string",
      minLength: 1,
    },
  },
};
