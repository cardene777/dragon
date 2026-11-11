/**
 * 編集画面の棚の、枝を消す部品 (#3632)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に枝を消す部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に枝を消す部品は無く、枝分かれの図の枝は記法の行で消す" } satisfies BlockShelf;
