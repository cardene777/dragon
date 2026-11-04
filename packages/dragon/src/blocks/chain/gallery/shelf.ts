/**
 * 編集画面の棚の、機械の列の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に機械の列の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に機械の列の部品は無く、試す図の機械の列は chain の行で書く" } satisfies BlockShelf;
