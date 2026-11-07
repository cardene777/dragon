/**
 * 部品を横に並べるブロック (#3429)。
 *
 * 試す図の部品 (`only: try`)。最初の `step` より前の `side <部品>, <部品>` の行で、網と待ち行列と機械の列のうち同じ行に置く部品を宣言する。
 * 枠が広い時は書いた順に左から並べ、同じ行の待ち行列はチップと題が入る幅だけを取り、残りの幅を網と機械の列に渡す。
 * 横に並べると字が読める大きさより小さくなる狭い枠では、`side` の行を持たない時と同じく縦に積む (`kinds/try/layout.ts`)。
 * 名指す部品は全ての宣言を読んでから確かめるので、部品の行より前に書いてもよい。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "side",
  rank: 112,
  attach: { how: "place", only: "try" },
  words: { heads: ["side"] },
};
