/** 見本帳の一覧の、値の札の名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "値の札",
    desc: "配管の図だけの部品。hold <持つ Contract>: <名前> <値> で宣言した値を、段の中の write <者>: <名前> <値> で書き替える。前の値は消し線で残る。",
  },
  en: {
    name: "Value card",
    desc: "Pipe diagrams only. A value declared with hold <contract>: <name> <value> is rewritten with write <writer>: <name> <value> in a step, and the old value stays struck through.",
  },
};
