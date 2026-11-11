/**
 * 編集画面の棚の、考えの部品 (#3619)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に考えの部品は無い。考えを広げる地図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に考えの部品は無く、考えを広げる地図の考えは記法の行で書く" } satisfies BlockShelf;
