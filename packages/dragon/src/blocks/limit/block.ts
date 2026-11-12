/**
 * 箱の上限のブロック (#3624)。
 *
 * 列の図の部品 (`only: lineup`)。`box <名札> [limit: <数>]` と書くと、その箱に並べられる札の数の上限になる。
 * 上限は 1 から 1 列に並べられる札の数 (`LANE_MOST`) までの整数で、`line` の行が上限を超える札を並べると、超えた最初の札の所で断る。
 * 層の見た目 (`[shape: layers]`) は箱を層にして札の数を見せないので、層の箱には書けない。
 * `limit` は箱の行の鍵なので、箱のブロックが箱の行と一緒に読み書きし、原本の形は箱の形 (`definitions.box`) が持つ。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "limit",
  rank: 106,
  attach: { how: "attach-to-box", only: "lineup" },
  words: { attrs: { box: ["limit"] } },
};
