/**
 * 編集画面の棚の、箱の上限の部品 (#3624)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に箱の上限の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に箱の上限の部品は無く、列の図の箱の上限は box の行の limit の鍵で書く" } satisfies BlockShelf;
