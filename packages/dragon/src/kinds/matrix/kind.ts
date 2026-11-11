/**
 * 2つの軸で置く図 (`matrix`) の定義 (#3622)。
 * 横と縦の 2 つの軸で 4 つの区画に分け、段ごとに課題の札を区画へ置く。区画の箱と課題を置く付け方と、段と出典の図に付く付け方だけを受け付け、
 * 中身の帯 (`strip`) は、そのブロックの `except` で描かない図の種類に書く。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "matrix",
  accepts: ["place", "attach-to-figure"],
  later: true,
};
