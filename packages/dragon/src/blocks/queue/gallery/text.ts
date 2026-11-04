/** 見本帳の一覧の、待ち行列の名前と説明 (#3337、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "待ち行列",
    desc: "試す図だけの部品。最初の step より前に queue <名札> [order: <欄>] と書くと、チップが待つ行列を描く。order を書くとその欄の値の高い順に上から並べ、書かなければ入った順に並べる。段の中の line <待ち行列>: <チップ>, <チップ> で中身を書く。",
  },
  en: {
    name: "Queue",
    desc: "Try diagrams only. Write queue <id> [order: <field>] before the first step to draw a line where chips wait. With order, chips sort from the highest value of that field at the top; without it, they keep the order they came in. line <queue>: <chip>, <chip> in a step writes its contents.",
  },
};
