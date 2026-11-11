/**
 * 考えを広げる地図 (`mind`) の定義 (#3619)。
 * 真ん中の題から枝と葉を四方へ広げ、段ごとに書いた考えを濃く出す。考えを置く付け方と、段と出典の図に付く付け方だけを受け付け、
 * 箱 (`box`) と中身の帯 (`strip`) は、そのブロックの `except` で描かない図の種類に書く。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "mind",
  accepts: ["place", "attach-to-figure"],
  later: true,
};
