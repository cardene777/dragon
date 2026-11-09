/**
 * 量の図 (`chart`、#3560) の定義。
 * 項目ごとの割合をドーナツの弧で、量を横棒の長さで描き、段ごとに値が変わって図がその値へ動く。箱と線を持たないので、
 * つなぐと線に乗ると箱に付くの付け方を受け付けず、置くと図に付くの 2 つを受け付ける。箱と中身の帯のブロックは量の図を `except` に書く。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "chart",
  accepts: ["place", "attach-to-figure"],
  later: true,
};
