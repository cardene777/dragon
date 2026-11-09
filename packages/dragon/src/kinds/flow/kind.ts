/**
 * 手順の図 (`flow`) の定義 (#3561)。
 * 判断のひし形で道が分かれる手順を段で追い、本筋の箱と判断を上から下へ 1 列に並べる。5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "flow",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
