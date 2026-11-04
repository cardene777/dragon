/**
 * 編集画面の棚の、印の列の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に印の列の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に印の列の部品は無く、時間軸の図の印の列は row と mark の行で書く" };
