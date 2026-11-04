/**
 * 列の図 (`lineup`) の定義 (#3348)。
 * 箱を列にして、チップを段ごとに並べ直す。線を持たないので、つなぐと線に乗るの付け方を受け付けず、置く、箱に付く、図に付くの 3 つを受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "lineup",
  accepts: ["place", "attach-to-box", "attach-to-figure"],
  later: true,
};
