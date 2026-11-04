/**
 * 編集画面の棚の、チップの部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) にチップの部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧にチップの部品は無く、列の図のチップは item の行で書く" } satisfies BlockShelf;
