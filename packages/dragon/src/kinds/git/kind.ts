/**
 * 枝分かれの図 (`git`) の定義 (#3347)。
 * 枝を上から帯に積み、commit を左から積んで、枝の分かれと取り込みと当て直しを線で結ぶ。5 つの付け方を全て受け付ける。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "git",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  later: true,
};
