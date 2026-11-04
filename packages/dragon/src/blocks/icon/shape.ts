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
  },
};
