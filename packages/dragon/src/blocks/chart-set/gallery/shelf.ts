/**
 * 編集画面の棚の、量の図の値の部品 (#3560)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に値の部品は無く、量の図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に値の部品は無く、量の図は見本の束から書き始める" } satisfies BlockShelf;
