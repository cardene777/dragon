/**
 * 試す図 (`try`) の定義 (#3337、#3348)。
 * 部品 (網、待ち行列、機械の列、釦、入力の帯) を上から積み、読み手が値を入れて動かす。箱と線を持たないので、置くと図に付くの 2 つを受け付ける。
 * 箱と段と出典と中身の帯は、置くか図に付く付け方でも試す図に描かないので、それぞれのブロックが付け方の `except` で断る。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "try",
  accepts: ["place", "attach-to-figure"],
  later: true,
};
