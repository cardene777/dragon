/**
 * 量の図の項目のブロック (#3560)。
 *
 * 量の図の部品 (`only: chart`)。最初の `step` より前の `item <名札> as <名前> [color: <色>]` の行で、割合か量を比べる項目を宣言する。
 * `as` を書かない項目は名札を名前にし、`color` を書かない項目には宣言した順に色の役を配る。項目は 1 つ以上、`CHART_ITEMS_MOST` 個まで書ける。
 * 行の頭の語 `item` は列の図のチップのブロックが持つ語なので、量の図の `item` の行はこのブロックが行の形 (`lines`) で読み、ほかの種類の図の `item` の行の読み方を変えない。
 * 量の図の決まり (書けない行と線を断る、項目が要る) もこのブロックの読み方が持つ。
 */
import type { Block } from "../block";
import type { Color } from "../color/block";

/** 1 つの量の図に書ける項目の数の上限。それより多い項目は「その他」にまとめず、誤りで止める */
export const CHART_ITEMS_MOST = 8;

/** 量の図の項目。`name` は凡例と棒の左に出す名前で、`color` を書かない項目は宣言した順に色の役を配る */
export interface ChartItem {
  id: string;
  name: string;
  color?: Color;
}

export const block: Block = {
  name: "chart-item",
  rank: 141,
  attach: { how: "place", only: "chart" },
  words: {},
  // 量の図の決まり (書けない行と線を断る、項目が要る) を持つ
  always: true,
  // 量の図の `item` の行は項目の宣言として読み、線の行は断る
  lines: [{ heads: ["item"] }, { edges: "any" }],
};
