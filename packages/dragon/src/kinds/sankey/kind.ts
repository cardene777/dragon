/**
 * 量の行き先の図 (`sankey`、#3626) の定義。
 * 1 つの量がどこへどれだけ分かれるかを段で追い、出どころの棒から右の列の行き先の棒へ、量に比べた幅の帯を伸ばす。
 * 量の札は線の名前を出すので、線に乗るの付け方 (線の名前を置く側と運ぶ物) を受け付けず、置くとつなぐと箱に付くと図に付くの 4 つを受け付ける。
 * 箱の中の処理と絵と飛び先と小さな字と中身の帯のブロックは量の行き先の図を `except` に書く。
 * 見本帳を開いた時に読まない図の種類なので、並べ方 (`layout.ts`) を読まずに後から読むと名乗る
 */
import type { Kind } from "../kind";

export const kind: Kind = {
  name: "sankey",
  accepts: ["place", "connect", "attach-to-box", "attach-to-figure"],
  later: true,
};
