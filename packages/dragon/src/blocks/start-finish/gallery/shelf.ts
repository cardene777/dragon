/**
 * 編集画面の棚の、始まりと終わりの部品 (#3347)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に始まりと終わりの部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に始まりと終わりの部品は無く、状態遷移図の始まりと終わりは記法の行で書く" };
