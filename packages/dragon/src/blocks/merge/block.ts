/**
 * merge commit のブロック (#3164、#3347)。
 *
 * 枝分かれの図の接続ブロック (`only: git`)。`commit <名札> on <枝>` の後ろに `merge <枝>` を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になり、
 * 取り込む枝の先端から merge commit へ線を引いて 2 つの commit を結ぶ。取り込む先の札だけが進む。
 * `merge` の語は commit の行の中に書くので行の頭の語を持たず、commit の行は commit のブロックが読み書きする。
 * 取り込む枝を確かめる処理 (`mergedAt`) と誤りの文はこのブロックが持ち、commit のブロックが呼ぶ。
 */
import type { Block } from "../block";

export const MERGE = "merge";

export const block: Block = {
  name: "merge",
  rank: 8,
  attach: { how: "connect", only: "git" },
  words: {},
};
