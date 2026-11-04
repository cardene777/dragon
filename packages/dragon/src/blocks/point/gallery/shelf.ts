/**
 * 編集画面の棚の、節目の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に節目の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に節目の部品は無く、時間軸の図の節目は point の行で書く" } satisfies BlockShelf;
