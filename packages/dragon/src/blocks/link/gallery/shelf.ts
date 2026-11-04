/**
 * 編集画面の棚の、飛び先の部品 (#3345)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に飛び先は無い。
 * 飛び先は箱の行の属性で、棚の箱の部品が `link` の鍵を持って置かれる
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に飛び先は無く、棚の箱の部品が link の鍵を持って置かれる" } satisfies BlockShelf;
