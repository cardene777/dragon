/**
 * 編集画面の棚の、場面の部品 (#3878)。
 * 場面は共通の段の後ろに段の組を足す書き方なので、棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に場面の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に場面の部品は無く、場面は記法の scene と end の行で書く" } satisfies BlockShelf;
