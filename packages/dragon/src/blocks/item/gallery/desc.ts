/** 見本帳の部品の頁の、チップの説明 (#3239、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。最初の step より前に item <名札>, <名札> [color: <色>, label: <字>] と書くと、列に並べるチップを宣言する。色を付けたチップは色で塗り、label の字は 4 字まで載る。",
  en: "Lineup diagrams only. Write item <id>, <id> [color: <color>, label: <text>] before the first step to declare the chips the lanes hold. A chip with a color is filled with it, and a label of up to 4 characters sits on the chip.",
};
