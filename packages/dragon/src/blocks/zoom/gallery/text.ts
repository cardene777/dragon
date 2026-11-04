/** 見本帳の一覧の、拡大の帯の名前と説明 (#3165、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "拡大の帯",
    desc: "時間軸の図だけの部品。zoom の行で目盛りの範囲を書くと、上の帯にその目盛りを列にして並べ、宣言した箱を列ごとに繰り返す。線は [at: <目盛り>] の列の箱どうしを結び、受ける箱を別の列から選ぶ時は into を書く。",
  },
  en: {
    name: "Zoom band",
    desc: "Time diagrams only. A zoom line gives a range of units, laid out as columns in the band above, with the declared boxes repeated in every column. A line joins the boxes of the column in [at: <unit>]; write into to take the receiving box from another column.",
  },
};
