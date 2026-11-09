/** 使い方の頁の「量の図」の節の、見た目の段落 (#3560) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "chart",
  ja: [
    "`chart <題> [shape: donut]` は項目ごとの割合をドーナツの弧の角度で描き、輪の真ん中に段の名前を、凡例に名前と整数に丸めた割合を出す。`chart <題> [shape: bar]` は項目ごとの量を横棒の長さで描き、一番大きい値の棒を一番長くして、棒の端に値を出す。見た目はどちらかを必ず書き、段ごとに替えない。",
  ],
  en: [
    "`chart <title> [shape: donut]` draws the share of each item as the angle of an arc of a donut, with the step name in the middle of the ring and the names and rounded percentages in the legend. `chart <title> [shape: bar]` draws the amount of each item as the length of a bar, makes the bar of the largest value the longest, and shows each value at the end of its bar. Write one of the two shapes, and it stays the same through the steps.",
  ],
};
