/**
 * 構成図 (`architecture`) の寄って追う窓の線の端の箱 (#3871)。
 * 状態遷移図と同じく段で引いた線の両端の箱を挙げ、窓の端で切れる箱に名前を書いた札を出す。
 * 置き場 (`follow-ends-store.ts`) へは、全部を持つ入口が読み込みの時に、軽い入口が `loadFor` で後から置く。
 */
import { edgeEnds, followEnds } from "./follow-ends";

export const ARCHITECTURE_ENDS = followEnds((layout, _diagram, step) => edgeEnds(layout, step));
