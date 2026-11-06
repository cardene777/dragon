/** 見本帳の一覧の、入力の帯の名前と説明 (#3337、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "入力の帯",
    desc: "試す図だけの部品。最初の step より前に ask <欄>, <欄> [into: <待ち行列>, via: <網>] と書くと、欄ごとの入力と送る釦を持つ帯が出る。読み手が値を打ち込んで送ると、最初の欄の値を名前にしたチップが into の待ち行列へ入る。choose <欄>: <値>, <値> の行を足すと、その欄は書いた値から選ぶ欄になる。段の中の ask <値>, <値> は書き手の例として送る。",
  },
  en: {
    name: "Input strip",
    desc: "Try diagrams only. Write ask <field>, <field> [into: <queue>, via: <network>] before the first step and a strip with an input per field and a send button appears. When the reader types values and sends, a chip named by the first field's value enters the queue in into. Add a choose <field>: <value>, <value> line and that field becomes a pick from the written choices. ask <value>, <value> in a step sends one as the author's example.",
  },
};
