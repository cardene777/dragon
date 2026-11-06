/**
 * icon のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { ICON_NAMES } from "./block";

export const shape: BlockShape = {
  definitions: {
    icon: { description: "箱と区画のアイコン名。描く部品のアイコンの表 (ICONS) に在る名前だけ", enum: ICON_NAMES },
    // 箱と区画の icon の欄。+ で始まる名前は使う人が足した印のブロックの名前で、それ以外はアイコン名の一覧から選ぶ (#3399)。
    // anyOf で包むと知らないアイコン名の誤りが 1 つにまとまって近い名前を挙げられないので、+ の有無で分ける
    iconField: {
      description: "箱と区画の icon の欄。アイコンの表 (ICONS) に在る名前か、使う人が足した印のブロックの名前 (+ で始まる)",
      type: "string",
      if: { pattern: "^\\+" },
      then: { $ref: "#/definitions/userBlockName" },
      else: { $ref: "#/definitions/icon" },
    },
  },
};
