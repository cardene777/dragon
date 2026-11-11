/**
 * 編集画面の棚の、量の帯の部品 (#3626)。
 * 量の帯は行の頭の語を持たず、棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に量の帯の部品は無い。量の行き先の図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "量の帯は行の頭の語を持たない" } satisfies BlockShelf;
