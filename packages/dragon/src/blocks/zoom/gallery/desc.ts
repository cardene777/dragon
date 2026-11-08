/** 見本帳の部品の頁の、拡大の帯の説明 (#3165、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "時間軸の図だけの部品。zoom の行で目盛りの範囲を書くと、上の帯にその目盛りを列にして並べ、宣言した箱を列ごとに繰り返す。線は [at: <目盛り>] の列の箱どうしを結び、受ける箱を別の列から選ぶ時は into を書く。",
  en: "Time diagrams only. A zoom line gives a range of units, laid out as columns in the band above, with the declared boxes repeated in every column. A line joins the boxes of the column in [at: <unit>]; write into to take the receiving box from another column.",
};
