/**
 * 編集画面の棚の、記録の列の部品 (#3441)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に記録の列の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に記録の列の部品は無く、試す図の記録の列は log の行で書く" } satisfies BlockShelf;
