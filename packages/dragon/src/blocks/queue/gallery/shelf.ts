/**
 * 編集画面の棚の、待ち行列の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に待ち行列の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に待ち行列の部品は無く、試す図の待ち行列は queue の行で書く" };
