/** 見本帳の部品の頁の、入力の帯の説明 (#3337、#3348、#3441、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "試す図だけの部品。最初の step より前に ask <欄>, <欄> [into: <待ち行列か欄>, via: <網>] と書くと、欄ごとの入力と送る釦を持つ帯が出る。読み手が値を打ち込んで送ると、最初の欄の値を名前にしたチップが into の待ち行列へ入る。choose <欄>: <値>, <値> の行を足すと、その欄は書いた値から選ぶ欄になる。into に choose の行を持つ欄を書くと、チップはその欄で選んだ値と同じ名札の待ち行列へ入る。段の中の ask <値>, <値> は書き手の例として送る。",
  en: "Try diagrams only. Write ask <field>, <field> [into: <queue or field>, via: <network>] before the first step and a strip with an input per field and a send button appears. When the reader types values and sends, a chip named by the first field's value enters the queue in into. Add a choose <field>: <value>, <value> line and that field becomes a pick from the written choices. Name a field with a choose line in into, and the chip enters the queue whose id matches the value picked for that field. ask <value>, <value> in a step sends one as the author's example.",
};
