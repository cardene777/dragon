/** 使い方の頁の「手順の図」の節の、判断と今回は通らない道の段落 (#3561) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "flow",
  ja: [
    "判断で道が分かれる手順を段ごとに追う時は、最初の行を `flow <題>` にする。手順は `box` の行で、判断は `choice <名札> as <問い>` の行で宣言し、判断はひし形で描く。段の線が初めて辿り着く順に、手順と判断が上から下へ 1 列に並ぶ。",
    "最初の `step` の行より前に書いた線は今回は通らない道で、最初の段から点線で引く。判断から出る線は名前を持つ 2 本までで、本筋に無い箱へ入る点線の道は判断の右の角から出る。前の手順へ戻る線と 3 つ以上に分かれる判断は書けず、戻る道は状態遷移図で描く。",
  ],
  en: [
    "To follow, step by step, a procedure that branches at decisions, start the first line with `flow <title>`. Declare each task with a `box` line and each decision with a `choice <id> as <question>` line; a choice is drawn as a diamond. Tasks and choices stack top to bottom in the order the step lines first reach them.",
    "Lines written before the first `step` line are paths not taken this time and are drawn dotted from the first step. A choice leads to at most two places and every line leaving it has a name. A dotted path to a box off the main path leaves the diamond from its right corner. Lines back to an earlier task and choices that split three ways are refused; draw loops in a state diagram.",
  ],
};
