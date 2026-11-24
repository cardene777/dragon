/**
 * 編集画面の棚の、持ち主ごとのカードの部品 (#3846)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に持ち主ごとのカードの部品は無く、持ち主ごとのカードの図は見本の束から書き始める
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に持ち主ごとのカードの部品は無く、カードは item の行で書く" } satisfies BlockShelf;
