/**
 * seal のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";

/** 列 `box` に封をするか開ける出来事の形 */
const sealEvent = (word: "seal" | "open", description: string): unknown => ({
  description,
  type: "object",
  additionalProperties: false,
  required: ["type", "box"],
  properties: {
    type: { const: word },
    box: { $ref: "#/definitions/id" },
  },
});

export const shape: BlockShape = {
  events: {
    seal: sealEvent("seal", "列 box に封をして、チップを隠す。列の図だけが書ける"),
    open: sealEvent("open", "列 box の封を開ける。列の図だけが書ける"),
  },
};
