/**
 * 時間軸の図 (`time`) の定義 (#3348)。
 * 時間軸に目盛りを並べ、針を決まった速さで進めて、印の列と節目と拡大の帯の箱を時刻に合わせて動かす。5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "time",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
