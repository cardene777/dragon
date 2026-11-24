/**
 * 編集画面の棚の、押すと出る札の部品 (#3877)。
 * 札は図の 1 行目と箱の行の属性なので、棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に札の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "札は図の 1 行目と箱の行の属性で、棚の部品の一覧に札の部品は無い" } satisfies BlockShelf;
