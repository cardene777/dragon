/** 見本帳の一覧の、節目の名前と説明 (#3165、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "節目",
    desc: "時間軸の図だけの部品。point <名札> at <目盛り> で、その目盛りの印の下に旗の丸を置く。段の中の note で状態の字と丸の色を変え、節目どうしを線で結ぶ。",
  },
  en: {
    name: "Point",
    desc: "Time diagrams only. point <id> at <unit> puts a flag circle under the marks of that unit. note inside a step changes its state and the color of the circle, and lines can join two points.",
  },
};
