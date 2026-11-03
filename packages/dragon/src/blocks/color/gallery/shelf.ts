/**
 * 編集画面の棚の、色の役の部品 (#3345)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に色の役は無い。
 * 色は箱と区画の行の属性で、棚の箱と区画の部品が `color` の鍵を持って置かれる
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に色の役は無く、棚の箱と区画の部品が color の鍵を持って置かれる" };
