/** 見本帳の部品の頁の、置き場の説明 (#3351、#3348、#3531、#3624)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。box <名札> [order: none] と書くと、その箱は順番の無い置き場になる。名前の下に点線で囲んだ「順番なし」の札を出し、札に番号を付けない。ほかの箱は札に番号を付け、チップを書いた順に上から積む。",
  en: "Lineup diagrams only. Write box <id> [order: none] and the box becomes a pool with no order. It shows a dashed \"No order\" pill under its name, and its cards carry no numbers. Other boxes number their cards and stack them from the top in the order written.",
};
