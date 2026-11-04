/**
 * 編集画面の棚の、組んだ親の部品 (#3348)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に組んだ親の部品は無い
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に組んだ親の部品は無く、木の図の親は記法の行で書く" } satisfies BlockShelf;
