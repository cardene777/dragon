/**
 * 編集画面の棚の、通らない道の部品 (#3347)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に通らない道の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に通らない道の部品は無く、状態遷移図の通らない道は記法の行で書く" };
