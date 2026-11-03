/**
 * 色の役の描き方 (#3345)。
 *
 * 部品には色の役の変数 (`--c` と `--ct`) だけを渡し、値は色味の表が CSS の変数として 1 度だけ書く。
 * どの部品もこの file から変数を引くので、描く下請け (`render/parts.ts`) もここを読み、この file は下請けを読まない。
 */
import type { ColorKey } from "../../look/values";

/** 色の役を部品へ渡す変数。 */
export const cs = (k: ColorKey): string => (k === "coin" ? "--c:var(--coin);--ct:var(--coint)" : `--c:var(--c-${k});--ct:var(--t-${k})`);
