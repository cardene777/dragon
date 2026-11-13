/**
 * 2つの軸で置く図の課題のブロック (#3622)。
 *
 * 2つの軸で置く図の部品 (`only: matrix`)。最初の `step` より前の `item <名札> as <名前>` の行で課題を宣言し、
 * 段の中の `line <区画>: <課題>, <課題>` の行 (列の図と同じ形) で、その段に課題の札を区画へ置く。
 * まだ区画に置いていない課題は、区画の左の置く前の一覧に書いた順に並ぶ。前の段で置いた課題を別の区画へ書くと、札はその区画へ移る。
 * 課題の行に `[x: <横>, y: <縦>]` で 0 から 10 の点数を書くと、区画を書かない `line: <課題>` の行で点数から決まる区画へ置ける (#3637)。
 * 行の頭の語 `item` と `line` は列の図のブロックが持つ語なので、2つの軸で置く図の行はこのブロックが行の形 (`lines`) で読み、
 * ほかの種類の図の `item` と `line` の行の読み方を変えない。原本の段の中では列の図と同じ `line` の出来事 (区画 `box` と課題 `items`) になり、
 * 区画を書かない行は区画の欄を持たない出来事 (`MatrixPlot`) になる。
 */
import type { Block } from "../block";

/** 2つの軸で置く図の課題。`name` は札に書く名前で、`as` を書かない課題は名札を名前にする。`x` と `y` は横と縦の軸の 0 から 10 の点数 */
export interface MatrixItem {
  id: string;
  name: string;
  x?: number;
  y?: number;
}

/** 2つの軸で置く図の、区画を書かずに課題を打つ出来事 (#3637)。区画は課題の点数から決まる */
export interface MatrixPlot {
  type: "line";
  items: string[];
}

export const block: Block = {
  name: "matrix-item",
  rank: 151,
  attach: { how: "place", only: "matrix" },
  words: {},
  // 2つの軸で置く図の `item` と `line` の行は、列の図のチップと並びでなく課題の宣言と置く所として読む。区画を書かない行の頭の語は `line:` になる
  lines: [{ heads: ["item"] }, { heads: ["line", "line:"] }],
};
