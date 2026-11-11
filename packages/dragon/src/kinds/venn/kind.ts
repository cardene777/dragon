/**
 * 集合の重なりの図 (`venn`、#3620) の定義。
 * 2 つか 3 つの集まりを円で重ね、段ごとに円を足し、重なった区画を光らせ、区画ごとの数を見せる。箱と線を持たないので、
 * つなぐと線に乗ると箱に付くの付け方を受け付けず、置くと図に付くの 2 つを受け付ける。箱と中身の帯のブロックは集合の重なりの図を `except` に書く。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "venn",
  accepts: ["place", "attach-to-figure"],
  later: true,
};
