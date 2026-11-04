/**
 * 編集画面の棚の、凡例の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に凡例の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に凡例の部品は無く、列の図の凡例は item の行の note の鍵で書く" };
