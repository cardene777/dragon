/** 使い方の頁の「回り続ける図」の節の、輪と弧と輪の真ん中の段落 (#3623) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "cycle",
  ja: [
    "同じ手順を何度も回る流れを段ごとに追う時は、最初の行を `cycle <題>` にする。手順は最初の `step` の行より前に `box <名札> as <名前>` の行で宣言し、書いた順に輪の真上から右回りに並ぶ。手順は 2 つから 8 つまで書け、`[note: <字>]` は箱の名前の下に、`[color: <色>]` は箱の色になる。",
    "段の中の `<名札> -> <名札> [tag: <字>]` の行は、輪の次の手順への線になる。最後の手順から最初の手順への線も次の手順への線で、そこから次の回に入る。1 つ飛ばす線、逆回りの線、同じ手順へ戻る線と、`: <名前>` を付けた線は誤りで止まる。`act` と `group` の行は書けない。",
    "線の札はその段で弧に沿って次の手順へ走り、走った弧と矢じりは受ける側の手順の色で光ったまま残る。段の番号はその段で札が着いた手順の箱の横に出し、札の無い段は前の段の手順に出す。",
    "`strip <題>: <欄>, <欄>` を書くと、図の下でなく輪の真ん中に帯の題と欄の値を出す。段の中の `set <欄>: <値>` で値が入れ替わり、最初の欄の値は大きく、2 つ目からの欄の値は小さく出る。欄の名前は出さないので、値だけで読める字にする。最初に書いた後で変わった値は、変わった段の間だけその段の手順の色で出る。`set <欄> [tag: <札>]` の札の字は、値と同じ所に出る。",
    "最初の行を `cycle <題> [shape: clock]` にすると、手順を輪の代わりに時計の文字盤に置く。手順の `box` の行には `[time: 25min]` の形で手順の長さを書き、長さは 0 でない数と単位 (`ms`、`s`、`min`、`h`、`d`) の組にする。どの手順にも長さを書き、手順は 12 時から右回りに、長さに合わせた弧で並ぶ。目盛りの数字は書いた中で一番大きい単位で 0 から切りのよい間隔で出る。",
    "文字盤の針は 1 本で、段ごとにその段の手順の弧の始まりを指し、線の札は針の先に乗って走る。その回 (針が 12 時を越えるまで) に入った手順の弧は手順の色で光ったまま残る。`[shape: clock, turn: left]` と書くと文字盤が左回りになり、`turn` は `[shape: clock]` の図にだけ書ける。携帯の幅では手順の名前の代わりに番号を文字盤の外に出し、番号と名前と長さの一覧を文字盤の下に並べる。",
  ],
  en: [
    "To follow, step by step, a flow that goes around the same steps again and again, start the first line with `cycle <title>`. Declare the steps with `box <id> as <name>` lines before the first `step` line; they sit on a ring clockwise from the top in the order written. A ring takes 2 to 8 steps. `[note: <text>]` goes under the box name and `[color: <color>]` sets the box color.",
    "A `<id> -> <id> [tag: <text>]` line in a step is a line to the next step on the ring. A line from the last step to the first one is also a line to the next step, and it starts the next round. A line that skips a step, goes backward, returns to the same step or carries a `: <name>` is refused. `act` and `group` lines are not allowed.",
    "In that step the chip runs along the arc to the next step, and the arc and its arrowhead stay lit in the color of the receiving step. A step's number sits beside the box the chip reached, and a step without a line puts its number beside the box the step before ended at.",
    "With `strip <title>: <field>, <field>`, the strip title and the field values go in the middle of the ring instead of under the diagram. `set <field>: <value>` in a step changes a value; the first field shows large and the others show smaller. Field names are not shown, so write values that read on their own. A value that changes after it was first written shows in the color of that step's box while the step lasts. The text of a `set <field> [tag: <tag>]` shows where the value goes.",
    "Start the first line with `cycle <title> [shape: clock]` to set the steps on a clock dial instead of a ring. Each step `box` line takes the length of the step, such as `[time: 25min]`, written as a number other than 0 and a unit (`ms`, `s`, `min`, `h` or `d`). Every step needs a length, and the steps sit clockwise from 12 o'clock as arcs as long as they take. The numbers around the dial count from 0 at round steps in the largest unit written.",
    "The dial has one hand. In each step it points at the start of that step's arc, and the chip of a line rides the tip of the hand. The arcs entered in the current round, until the hand passes 12 o'clock, stay lit in their step colors. `[shape: clock, turn: left]` turns the dial counterclockwise, and `turn` can be written only with `[shape: clock]`. At a phone width the step numbers sit outside the dial in place of the names, and a list of numbers, names and lengths sits below the dial.",
  ],
};
