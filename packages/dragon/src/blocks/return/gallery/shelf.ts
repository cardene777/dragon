/**
 * 編集画面の棚の、呼び出しの管の部品 (#3389)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に呼び出しの管の部品は無く、配管の図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に呼び出しの管の部品は無く、配管の図は見本の束から書き始める" } satisfies BlockShelf;
