/** 使い方の頁の「量の図」の節の、値の段落 (#3560) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "chart",
  ja: [
    "`set <名札>: <値>` は段の中に書く項目の値で、0 以上の数を単位を付けずに書く。段を送ると、弧と棒は前の段の値から新しい値へ動く。`set` を書かない項目は前の段の値を保ち、まだ値の無い項目は弧も棒も出さない。",
  ],
  en: [
    "`set <id>: <value>` inside a step is the value of the item, a number of 0 or more written without a unit. Going to the next step moves the arcs and bars from the previous values to the new ones. An item without `set` keeps its previous value, and an item with no value yet shows no arc or bar.",
  ],
};
