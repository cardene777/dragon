/**
 * 時系列図 (`sequence`) の定義 (#3345)。
 * 箱を生存線の頭に横 1 列に置き、線と処理を段の順に上から積む。5 つの付け方を全て受け付ける。
 * 並べ方 (`layout.ts`) は種類の登録の file (`kind-use/sequence.ts`) が登録簿へ登録し、この定義は読まない (#3763)
 */
import type { EagerKind } from "../kind";

export const kind: EagerKind = {
  name: "sequence",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  short: true,
};
