/**
 * 配管の図 (`pipe`) の定義 (#3389)。
 * Solidity の関数を呼んだ時に中で何が起きたかを、関係者の列と上の呼び出しの管と下の槽と管で段ごとに見せる。
 * 関係者を置き、呼び出しでつなぎ、呼び出しの線に種類と ETH と畳む印を乗せ、関係者に値と確認と換算を付け、図にイベントを付けるので、5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "pipe",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
