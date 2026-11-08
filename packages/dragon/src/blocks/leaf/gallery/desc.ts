/** 見本帳の部品の頁の、葉と札の説明 (#3233、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "木の図だけの部品。段の中に leaf <名札> [hash: <値>] と書くと、その段で葉の箱が現れる。値を持つ葉は箱に値を、葉の下の札に名札を出す。札は最初の段から見える。",
  en: "Tree diagrams only. Write leaf <id> [hash: <value>] in a step and a leaf box appears in that step. A leaf with a value shows the value in the box and its id on a card below. The card is there from the first step.",
};
