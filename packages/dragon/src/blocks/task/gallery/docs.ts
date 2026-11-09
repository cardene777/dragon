/** 使い方の頁の「時間軸の図」の節の、作業の棒の段落 (#3562) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "time",
  ja: [
    "工程表のように作業の期間を見せる時は、最初の `step` より前に `task <名札> as <名前> <範囲> [color: <色>]` を書く。作業は 1 つずつ自分の行を持ち、範囲の目盛りの上に続いた太い棒で描かれる。範囲は `mark` と同じく 0 から数える目盛りで、`0-2` か `13` と書く。行の左に作業の名前、棒の中に `1〜3日` のように始まりと終わりの目盛りの名前で期間が出て、針が通った分の棒が濃く塗られる。軸の字も同じ番号で、番号の目盛りの真ん中に出る。作業を持つ図は `row` を書かなくてよく、`row` と並べる時は宣言した順に上から並ぶ。",
  ],
  en: [
    "To show how long tasks take, as in a schedule, write `task <id> as <name> <range> [color: <color>]` before the first `step`. Each task gets its own row and is drawn as one thick bar over the ticks of the range. A range counts ticks from 0 like `mark`, as `0-2` or `13`. The name sits to the left of the row and the first and last tick names with the scale name (such as `Day 1–3`) inside the bar, and the bar fills as the needle passes. The axis uses the same tick names, each centered on its tick. A diagram with tasks needs no `row`, and tasks and rows keep the declared order from top to bottom.",
  ],
};
