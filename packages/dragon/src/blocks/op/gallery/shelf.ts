/**
 * 編集画面の棚の、線を起こした操作の番号の部品 (#3720)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に操作の番号の部品は無く、線の行に属性を書いて付ける
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に操作の番号の部品は無く、線の行に属性を書いて付ける" } satisfies BlockShelf;
