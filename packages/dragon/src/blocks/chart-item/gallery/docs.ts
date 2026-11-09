/** 使い方の頁の「量の図」の節の、項目の段落 (#3560) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "chart",
  ja: [
    "`item <名札> as <名前> [color: <色>]` は比べる項目で、最初の `step` より前に宣言した順に並ぶ。ドーナツは 12 時の向きから時計回りに弧を並べて凡例に名前を出し、横棒は上から棒を並べて棒の左に名前を出す。`color` を書かない項目には宣言した順に色を配る。項目は 1 つ以上、8 個まで書ける。",
  ],
  en: [
    "`item <id> as <name> [color: <color>]` is an item to compare, placed in the order declared before the first `step`. A donut lays the arcs clockwise from 12 o'clock and shows the names in its legend, and a bar chart stacks the bars from the top with each name on the left. An item without `color` gets a color in the order declared. A chart takes from 1 to 8 items.",
  ],
};
