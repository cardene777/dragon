/** 見本帳の一覧の、選ぶ部品の名前と説明 (#3239、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "選ぶ",
    desc: "列の図だけの部品。段の中に pick <列> と書くと、その列の縁に色が付き、ほかの列が薄くなる。薄くなった列は、後の段で並びを書き換えるか選ぶと濃く戻る。",
  },
  en: {
    name: "Pick",
    desc: "Lineup diagrams only. Write pick <lane> in a step and the edge of that lane lights up while the other lanes fade. A faded lane comes back when a later step rewrites its order or picks it.",
  },
};
