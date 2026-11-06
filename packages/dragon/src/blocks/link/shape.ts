/**
 * link のブロックの原本の形の欠片 (#3346、#3348)。
 *
 * build の時に原本の検査を書き出す script (`scripts/build-validator.mjs`) と検査だけが、形の欠片の一覧 (`blocks/shapes.ts`) から読む。
 * 描く時には要らないので定義 (`block.ts`) に置かず、描く時に読む塊に入れない。
 */
import type { BlockShape } from "../block";
import { LINK_URL } from "./block";

export const shape: BlockShape = {
  definitions: {
    url: { description: "頁を移る形。/ で始まる path か、http:// か https:// で始まる URL", type: "string", pattern: LINK_URL },
  },
};
