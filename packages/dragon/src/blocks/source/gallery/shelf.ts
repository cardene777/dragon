/**
 * 編集画面の棚の、出典の部品 (#3345)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に出典は無い。
 * 出典の行の形は、棚の記法の早見 (`syntaxLines` の `source`) が見せる
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に出典は無く、行の形は棚の記法の早見が見せる" };
