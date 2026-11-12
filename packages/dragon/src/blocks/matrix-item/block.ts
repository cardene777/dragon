/**
 * 2つの軸で置く図の課題のブロック (#3622)。
 *
 * 2つの軸で置く図の部品 (`only: matrix`)。最初の `step` より前の `item <名札> as <名前>` の行で課題を宣言し、
 * 段の中の `line <区画>: <課題>, <課題>` の行 (列の図と同じ形) で、その段に課題の札を区画へ置く。
 * まだ区画に置いていない課題は、区画の左の置く前の一覧に書いた順に並ぶ。前の段で置いた課題を別の区画へ書くと、札はその区画へ移る。
 * 行の頭の語 `item` と `line` は列の図のブロックが持つ語なので、2つの軸で置く図の行はこのブロックが行の形 (`lines`) で読み、
 * ほかの種類の図の `item` と `line` の行の読み方を変えない。原本の段の中では列の図と同じ `line` の出来事 (区画 `box` と課題 `items`) になる。
 */
import type { Block } from "../block";

/** 2つの軸で置く図の課題。`name` は札に書く名前で、`as` を書かない課題は名札を名前にする */
export interface MatrixItem {
  id: string;
  name: string;
}

export const block: Block = {
  name: "matrix-item",
  rank: 151,
  attach: { how: "place", only: "matrix" },
  words: {},
  // 2つの軸で置く図の `item` と `line` の行は、列の図のチップと並びでなく課題の宣言と置く所として読む
  lines: [{ heads: ["item"] }, { heads: ["line"] }],
};
