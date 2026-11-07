/**
 * 編集画面の棚の、部品を横に並べる行 (#3429)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に横に並べる部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に横に並べる部品は無く、試す図の部品を横に並べる時は side の行で書く" } satisfies BlockShelf;
