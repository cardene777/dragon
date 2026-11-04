/** 見本帳の一覧の、葉と札の名前と説明 (#3233、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "葉と札", desc: "木の図だけの部品。段の中に leaf <名札> [hash: <値>] と書くと、その段で葉の箱が現れる。値を持つ葉は箱に値を、葉の下の札に名札を出す。札は最初の段から見える。" },
  en: {
    name: "Leaf and card",
    desc: "Tree diagrams only. Write leaf <id> [hash: <value>] in a step and a leaf box appears in that step. A leaf with a value shows the value in the box and its id on a card below. The card is there from the first step.",
  },
};
