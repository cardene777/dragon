/** 見本帳の一覧の、凡例の名前と説明 (#3351、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "凡例",
    desc: "列の図だけの部品。item の行に [note: <説明>] と書くと、図の下の凡例にチップの説明が出る。同じ説明は最初のチップの色で 1 行にまとまる。",
  },
  en: {
    name: "Legend",
    desc: "Lineup diagrams only. Add [note: <text>] to an item line and the legend under the diagram explains the chip. Chips with the same note share one row in the color of the first chip.",
  },
};
