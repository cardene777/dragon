/** 見本帳の部品の頁の、札の説明 (#3239、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。段の中に stamp <列>: <字> と書くと、列の右に傾いた札が押される。署名や承認のように、列の中身に触れずに起きたことを見せる。",
  en: "Lineup diagrams only. Write stamp <lane>: <text> in a step and a tilted stamp lands on the right of the lane. Use it for something that happens without touching the contents, such as a signature or an approval.",
};
