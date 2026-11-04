/**
 * 編集画面の棚の、選ぶ部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に選ぶ部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に選ぶ部品は無く、列の図で列を選ぶ時は pick の行で書く" } satisfies BlockShelf;
