/** 見本帳の部品の頁の、組んだ親の説明 (#3233、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "木の図だけの部品。段の中に node <名札> of <子>, <子> [hash: <値>] と書くと、前に書いた葉か親を子にして親の箱が現れ、子と親を木の線で結ぶ。親子の箱どうしの線は木の線の上を走る。親を持たない箱は最後に根の 1 つだけ残す。",
  en: "Tree diagrams only. Write node <id> of <child>, <child> [hash: <value>] in a step and a parent box appears over the leaves or parents written earlier, joined to them by tree lines. A line between a parent and its child runs along the tree line. Only the root is left without a parent at the end.",
};
