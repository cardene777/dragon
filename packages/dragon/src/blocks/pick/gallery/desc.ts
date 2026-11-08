/** 見本帳の部品の頁の、選ぶ部品の説明 (#3239、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。段の中に pick <列> と書くと、その列の縁に色が付き、ほかの列が薄くなる。薄くなった列は、後の段で並びを書き換えるか選ぶと濃く戻る。",
  en: "Lineup diagrams only. Write pick <lane> in a step and the edge of that lane lights up while the other lanes fade. A faded lane comes back when a later step rewrites its order or picks it.",
};
