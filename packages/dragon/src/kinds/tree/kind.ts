/**
 * 木の図 (`tree`) の定義 (#3348)。
 * 段ごとに葉を出し、子から親を組んで、根まで木の線で結ぶ。5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "tree",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
