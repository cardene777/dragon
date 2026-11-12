/** 使い方の頁の「量の図」の節の、見た目の段落 (#3560) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "chart",
  ja: [
    "`chart <題> [shape: donut]` は項目ごとの割合をドーナツの弧の角度で描き、輪の真ん中に段の名前を、凡例に名前と整数に丸めた割合を出す。`chart <題> [shape: bar]` は項目ごとの量を横棒の長さで描き、一番大きい値の棒を一番長くして、棒の端に値を出す。見た目はどれかを必ず書き、段ごとに替えない。",
    "`chart <題> [shape: funnel]` は段を進むほど数が減る漏斗を描き、項目を宣言した順に上から段として並べる。段の棒は値を書いた段で現れ、左端を揃えて、長さを最初の段の値に比べて決める。前の段との差は薄い棒で残して去った数を書き、段の数の右に前の段に対する割合を出す。最後の段では、最初の段のうち最後の段まで残った割合の行を足す。前の段より大きい値と、どの段にも値を書かない段は、記法を読む時に誤りになる。",
  ],
  en: [
    "`chart <title> [shape: donut]` draws the share of each item as the angle of an arc of a donut, with the step name in the middle of the ring and the names and rounded percentages in the legend. `chart <title> [shape: bar]` draws the amount of each item as the length of a bar, makes the bar of the largest value the longest, and shows each value at the end of its bar. Write one of the shapes, and it stays the same through the steps.",
    "`chart <title> [shape: funnel]` draws a funnel, where the count shrinks stage by stage, and stacks the items from the top as stages in the order declared. A stage's bar appears in the step that sets it, left-aligned and as long as its value compared with the first stage. The gap to the stage above stays as a pale bar with the number who left, and the rate kept from the stage above shows beside the count. The last step adds a row with the share of the first stage that made it to the last one. A value larger than the stage above, and a stage that never gets a value, are errors when the notation is read.",
  ],
};
