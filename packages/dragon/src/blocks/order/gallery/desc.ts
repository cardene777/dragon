/** 見本帳の部品の頁の、置き場の説明 (#3351、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。box <名札> [order: none] と書くと、その箱は順番の無い置き場になる。チップを格子に並べ、点線の枠で描く。ほかの箱は札になり、チップを書いた順に上から積む。",
  en: "Lineup diagrams only. Write box <id> [order: none] and the box becomes a pool with no order. Its chips sit on a grid inside a dashed frame. Other boxes become cards that stack their chips from the top in the order written.",
};
