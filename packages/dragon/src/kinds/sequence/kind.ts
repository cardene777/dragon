/**
 * 時系列図 (`sequence`) の定義 (#3345)。
 * 箱を生存線の頭に横 1 列に置き、線と処理を段の順に上から積む。5 つの付け方を全て受け付ける
 */
import type { EagerKind } from "../kind";
import { layoutSequence } from "./layout";

export const kind: EagerKind = {
  name: "sequence",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  short: true,
  layout: layoutSequence,
};
