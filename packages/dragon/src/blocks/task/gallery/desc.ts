/** 見本帳の部品の頁の、作業の棒の説明 (#3562)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "時間軸の図だけの部品。task <名札> as <名前> <範囲> の行で作業を宣言すると、作業が自分の行を持ち、範囲の目盛りの上に続いた太い棒が引かれる。行の左に作業の名前、棒の中に 1〜3日 のように期間が出て、針が通った分の棒が濃く塗られる。軸の字も同じ番号で、番号の目盛りの真ん中に出る。印の列 (row) と並べる時は宣言した順に上から並ぶ。",
  en: "Time diagrams only. A task <id> as <name> <range> line declares a task on its own row, drawn as one thick bar over the ticks of the range. The name sits to the left and the first and last tick names (such as Day 1–3) inside the bar, and the bar fills as the needle passes. The axis uses the same tick names, each centered on its tick. Mixed with rows of marks, the rows keep the declared order from top to bottom.",
};
