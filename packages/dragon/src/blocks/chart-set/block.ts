/**
 * 量の図の値のブロック (#3560)。
 *
 * 量の図の部品 (`only: chart`)。段の中の `set <項目>: <値>` の行で、その段の項目の値を書く。値は 0 以上の数で、単位は書かない。
 * 段を送ると、弧と棒は前の段の値からこの値へ動く。`set` を書かない項目は前の段の値を保ち、まだ値の無い項目は 0 として弧も棒も出さない。
 * 行の頭の語 `set` は中身の帯のブロックが持つ語なので、量の図の `set` の行はこのブロックが行の形 (`lines`) で読み、ほかの種類の図の `set` の行の読み方を変えない。
 * 原本の JSON では段の中の値の出来事 (`type` が `set`) で、項目の名札 (`item`) と値 (`value`) を持つ。
 */
import type { Block } from "../block";

/** 量の図の、項目 `item` の値を `value` にする出来事 */
export interface ChartSet {
  type: "set";
  item: string;
  value: number;
}

export const block: Block = {
  name: "chart-set",
  rank: 142,
  attach: { how: "attach-to-figure", only: "chart" },
  words: {},
  // 量の図の `set` の行は、中身の帯の欄の値でなく項目の値として読む
  lines: [{ heads: ["set"] }],
};
