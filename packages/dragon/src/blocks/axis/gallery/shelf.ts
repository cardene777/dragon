/**
 * 編集画面の棚の、2つの軸で置く図の軸の部品 (#3622)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に軸の部品は無く、2つの軸で置く図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に軸の部品は無く、2つの軸で置く図は見本の束から書き始める" } satisfies BlockShelf;
