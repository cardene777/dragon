/**
 * 編集画面の棚の、輪の部品 (#3623)。
 * 輪は行の頭の語を持たず、棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に輪の部品は無い。回り続ける図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "輪は行の頭の語を持たない" } satisfies BlockShelf;
