/** 見本帳の一覧の、役の名前と説明 (#3351、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "役",
    desc: "列の図だけの部品。最初の step より前に role <名札> [note: <一言>] と書くと、役の札が箱の上に並ぶ。段の中に role <名札> と書くと、その段に役の札が光る。",
  },
  en: {
    name: "Role",
    desc: "Lineup diagrams only. Write role <id> [note: <text>] before the first step and a role card sits above the boxes. Write role <id> in a step and the card lights up in that step.",
  },
};
