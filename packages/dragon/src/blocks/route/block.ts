/**
 * 網のブロック (#3337、#3348)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>]` の行で、節と線の網を宣言する。
 * 入力の帯の `via` にこの網を書くと、送ったチップが `from` から `to` まで節の数が最も少ない道を辿る。`from` から `to` へ道が要る。
 * 試す図だけの行の頭の語の誤りと、試す図に書けない行の誤りと、部品の行が 1 つも無い誤りの文もこのブロックが持つ。
 * 試す図の部品は 5 つの部品の枝を原本の 1 つの欄 (`blocks.part`) の判別で持つので、部品の形は骨組みが持つ。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "route",
  rank: 107,
  attach: { how: "place", only: "try" },
  words: { heads: ["route"], attrs: { route: ["from", "to"] } },
  // 試す図の決まり (部品が要る、線と書けない行を断る、全ての宣言を読んでから確かめる) を持つ
  always: true,
  lines: [{ edges: "any" }],
};
