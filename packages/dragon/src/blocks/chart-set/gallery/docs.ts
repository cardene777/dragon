/** 使い方の頁の「量の図」の節の、値の段落 (#3560、`set none` は #3635) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "chart",
  ja: [
    "`set <名札>: <値>` は段の中に書く項目の値で、0 以上の数を単位を付けずに書く。段を送ると、弧と棒は前の段の値から新しい値へ動く。`set` を書かない項目は前の段の値を保ち、まだ値の無い項目は弧も棒も出さない。",
    "ドーナツと横棒と点で数える見た目は、段の中の `set none: <数>` でどの項目にも入らない数を書ける。ドーナツと横棒は項目の後ろに灰色の弧か棒で描き、点で数える見た目はその点を灰色のまま全体の箱に残す。漏斗は `set none` を宣言していない項目と同じく断る。",
  ],
  en: [
    "`set <id>: <value>` inside a step is the value of the item, a number of 0 or more written without a unit. Going to the next step moves the arcs and bars from the previous values to the new ones. An item without `set` keeps its previous value, and an item with no value yet shows no arc or bar.",
    "Donuts, bars and dots take `set none: <count>` inside a step for the count in none of the items. A donut or a bar draws it as a grey arc or bar after the items, and dots leave those dots grey in the box of the whole. A funnel refuses `set none` as it refuses an item that is not declared.",
  ],
};
