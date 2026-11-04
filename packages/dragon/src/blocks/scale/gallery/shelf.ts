/**
 * 編集画面の棚の、目盛りと針の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に目盛りと針の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に目盛りと針の部品は無く、時間軸の図の目盛りと針は scale と period と span の行と now の行で書く" };
