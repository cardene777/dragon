/**
 * 編集画面の棚の、判断の部品 (#3561)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に判断の部品は無く、手順の図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に判断の部品は無く、手順の図は見本の束から書き始める" } satisfies BlockShelf;
