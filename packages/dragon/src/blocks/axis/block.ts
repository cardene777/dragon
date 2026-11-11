/**
 * 軸のブロック (#3622)。
 *
 * 2つの軸で置く図の部品 (`only: matrix`)。最初の `step` より前の `axis <名前> [from: <小さい側>, to: <大きい側>]` の行で、
 * 1 行目を横の軸、2 行目を縦の軸にする。軸の名前と両端の字は矢印の軸に出し、`from` と `to` は省ける。
 * 区画は箱 (`box`) の行で書き、書いた順に左上、右上、左下、右下に置く。課題は課題のブロック (`matrix-item`) が読む。
 * 2つの軸で置く図の決まり (軸はちょうど 2 つ、区画はちょうど 4 つ、線と書けない行を断る) は、このブロックの読み方 (`read.ts`) が持つ。
 * 5 つ目の区画の行はその行で止めるので、箱の行を行の形 (`lines`) で先に見る。
 */
import type { Block } from "../block";
import type { MatrixItem } from "../matrix-item/block";

/** 2つの軸で置く図の軸の数。横の軸と縦の軸 */
export const MATRIX_AXES = 2;

/** 2つの軸で置く図の区画の数。左上、右上、左下、右下 */
export const MATRIX_AREAS = 4;

/** 2つの軸で置く図の軸。`from` は軸の始まりの小さい側の字、`to` は矢印の先の大きい側の字 */
export interface MatrixAxis {
  name: string;
  from?: string;
  to?: string;
}

/** 2つの軸で置く図の軸と課題。版1の原本に無かった種類なので、版2の原本の根の `matrix` の欄をそのまま持つ */
export interface MatrixSpec {
  /** 横の軸と縦の軸の順 */
  axes: MatrixAxis[];
  /** 書いた順の課題。置く前の一覧に、この順に上から並べる */
  items: MatrixItem[];
}

export const block: Block = {
  name: "axis",
  rank: 150,
  attach: { how: "attach-to-figure", only: "matrix" },
  words: { heads: ["axis"], attrs: { axis: ["from", "to"] } },
  // 軸と区画の数と、書けない行と線を断る決まりを持つ
  always: true,
  lines: [{ heads: ["box"] }, { edges: "any" }],
};
