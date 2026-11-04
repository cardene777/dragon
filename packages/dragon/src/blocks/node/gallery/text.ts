/** 見本帳の一覧の、組んだ親の名前と説明 (#3233、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "組んだ親",
    desc: "木の図だけの部品。段の中に node <名札> of <子>, <子> [hash: <値>] と書くと、前に書いた葉か親を子にして親の箱が現れ、子と親を木の線で結ぶ。親子の箱どうしの線は木の線の上を走る。親を持たない箱は最後に根の 1 つだけ残す。",
  },
  en: {
    name: "Parent node",
    desc: "Tree diagrams only. Write node <id> of <child>, <child> [hash: <value>] in a step and a parent box appears over the leaves or parents written earlier, joined to them by tree lines. A line between a parent and its child runs along the tree line. Only the root is left without a parent at the end.",
  },
};
