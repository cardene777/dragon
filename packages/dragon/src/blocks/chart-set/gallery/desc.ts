/** 見本帳の部品の頁の、量の図の値の説明 (#3560)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "量の図だけの部品。段の中の set <項目>: <値> で、その段の項目の値を書く。段を送ると弧と棒が前の段の値から動き、書かない項目は前の段の値を保つ。",
  en: "Charts only. set <item>: <value> in a step writes the value of the item for that step. Going to the next step moves the arcs and bars from the previous values, and an item not written keeps its previous value.",
};
