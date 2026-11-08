/** 見本帳の部品の頁の、凡例の説明 (#3351、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。item の行に [note: <説明>] と書くと、図の下の凡例にチップの説明が出る。同じ説明は最初のチップの色で 1 行にまとまる。",
  en: "Lineup diagrams only. Add [note: <text>] to an item line and the legend under the diagram explains the chip. Chips with the same note share one row in the color of the first chip.",
};
