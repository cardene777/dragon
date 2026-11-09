/**
 * 編集画面の棚の、作業の棒の部品 (#3562)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に作業の棒の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に作業の棒の部品は無く、時間軸の図の作業は task の行で書き、記法の早見に載る" } satisfies BlockShelf;
