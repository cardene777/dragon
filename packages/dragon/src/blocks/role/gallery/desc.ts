/** 見本帳の部品の頁の、役の説明 (#3351、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。最初の step より前に role <名札> [note: <一言>] と書くと、役の札が箱の上に並ぶ。段の中に role <名札> と書くと、その段に役の札が光る。",
  en: "Lineup diagrams only. Write role <id> [note: <text>] before the first step and a role card sits above the boxes. Write role <id> in a step and the card lights up in that step.",
};
