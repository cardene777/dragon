/**
 * 状態遷移図 (`state`) の定義 (#3347)。
 * 1 つの物が状態を移る様子を、辿った順に状態の箱を並べて追う。5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "state",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
