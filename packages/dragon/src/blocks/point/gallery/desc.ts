/** 見本帳の部品の頁の、節目の説明 (#3165、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "時間軸の図だけの部品。point <名札> at <目盛り> で、その目盛りの印の下に旗の丸を置く。段の中の note で状態の字と丸の色を変え、節目どうしを線で結ぶ。",
  en: "Time diagrams only. point <id> at <unit> puts a flag circle under the marks of that unit. note inside a step changes its state and the color of the circle, and lines can join two points.",
};
