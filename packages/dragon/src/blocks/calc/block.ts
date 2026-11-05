/**
 * 換算のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。段の中の `calc <行う者>: <入る値> -> <出る値>` の行で、行う者の列の下に入る値と出る値と比率の換算の札を出す。
 * 両側は数で書き (`100 USDC -> 0.05 WETH`)、比率は出る値を入る値で割った数 (`×0.0005`)。換算の札は、同じ行う者の次の `check` の段まで残る。
 */
import type { Block } from "../block";

/** 段の中の、`box` が `in` を `out` に換算する出来事 */
export interface PipeCalc {
  type: "calc";
  box: string;
  in: string;
  out: string;
}

export const block: Block = {
  name: "calc",
  rank: 127,
  attach: { how: "attach-to-box", only: "pipe" },
  words: { heads: ["calc"] },
};
