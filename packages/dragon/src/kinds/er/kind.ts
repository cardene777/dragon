/**
 * 表どうしの関係の図 (`er`) の定義 (#3618)。
 * 表を書いた順に左から右へ横 1 列に並べ、表どうしの結びの線と、段の中の線の札で、1 つの値がどの表のどの行を辿るかを見せる。
 * 表は箱でないので箱に付く付け方を受け付けず、置く、つなぐ、線に乗る、図に付くの 4 つを受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "er",
  accepts: ["place", "connect", "ride-on-line", "attach-to-figure"],
  later: true,
};
