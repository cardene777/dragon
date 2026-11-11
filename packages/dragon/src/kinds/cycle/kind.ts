/**
 * 回り続ける図 (`cycle`) の定義 (#3623)。
 * 輪になった手順を段で追い、手順の箱を書いた順に真上から右回りに輪の上へ並べる。5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "cycle",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
