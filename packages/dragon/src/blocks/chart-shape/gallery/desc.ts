/** 見本帳の部品の頁の、量の図の見た目の説明 (#3560)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "量の図だけの部品。最初の行の [shape: donut] は割合をドーナツの弧の角度で、[shape: bar] は量を横棒の長さで、[shape: funnel] は段ごとに減る数を漏斗の横棒で描き、[shape: dots] は件数を点の数で数える。どれかを必ず書き、段ごとに替えない。",
  en: "Charts only. [shape: donut] on the first line draws shares as arc angles of a donut, [shape: bar] draws amounts as bar lengths, [shape: funnel] draws a count that shrinks stage by stage as funnel bars, and [shape: dots] counts in dots. Write one of them, and it stays the same through the steps.",
};
