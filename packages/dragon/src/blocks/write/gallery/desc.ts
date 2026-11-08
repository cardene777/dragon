/** 見本帳の部品の頁の、値の札の説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。hold <持つ Contract>: <名前> <値> で宣言した値を、段の中の write <者>: <名前> <値> で書き替える。前の値は消し線で残る。",
  en: "Pipe diagrams only. A value declared with hold <contract>: <name> <value> is rewritten with write <writer>: <name> <value> in a step, and the old value stays struck through.",
};
