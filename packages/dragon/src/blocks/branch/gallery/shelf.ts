/**
 * 編集画面の棚の、枝の部品 (#3347)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に枝の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に枝の部品は無く、枝分かれの図の枝は記法の行で書く" } satisfies BlockShelf;
