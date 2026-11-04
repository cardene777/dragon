/**
 * 編集画面の棚の、生存線の部品 (#3345)。
 * 棚の部品の一覧 (`apps/playground-spa/src/editor/shelf-items.ts` の `PART_IDS`) に生存線は無い。
 * 生存線は時系列図の箱の下に自ずと立つので、棚の箱の部品を置けば出る
 */
import type { BlockShelf } from "../../gallery";

export const shelf = { none: "棚の部品の一覧に生存線は無く、時系列図に棚の箱の部品を置けば箱の下に立つ" } satisfies BlockShelf;
