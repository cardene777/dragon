/** 見本帳の一覧の、置き場の名前と説明 (#3351、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "置き場",
    desc: "列の図だけの部品。box <名札> [order: none] と書くと、その箱は順番の無い置き場になる。チップを散らして置き、点線の枠で描く。ほかの箱は札になり、チップを書いた順に上から積む。",
  },
  en: {
    name: "Pool",
    desc: "Lineup diagrams only. Write box <id> [order: none] and the box becomes a pool with no order. Its chips are scattered inside a dashed frame. Other boxes become cards that stack their chips from the top in the order written.",
  },
};
