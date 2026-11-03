/**
 * 編集画面の棚の、絵の部品 (#3345)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に絵は無い。
 * 絵は箱と区画の行の属性で、棚の箱と区画の部品が `icon` の鍵を持って置かれる
 */
import type { BlockShelf } from "../../gallery";

export const shelf: BlockShelf = { none: "棚の部品の一覧に絵は無く、棚の箱と区画の部品が icon の鍵を持って置かれる" };
