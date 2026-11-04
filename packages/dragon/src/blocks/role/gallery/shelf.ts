/**
 * 編集画面の棚の、役の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に役の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に役の部品は無く、列の図の役は role の行で書く" };
