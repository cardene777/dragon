/** 使い方の頁の「集合の重なりの図」の節の、集まりと数と重なりの段落 (#3620、点で数える見た目は #3635) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "venn",
  ja: [
    "2 つか 3 つの集まりの重なりと、重なった区画ごとの数を段ごとに見せる時は、最初の行を `venn <題>` にする。集まりは最初の `step` の行より前に `item <名札> as <名前>` の行で宣言し、2 つの集まりは左右に、3 つの集まりは左上と右上と下に同じ大きさの円で並ぶ。`[color: <色>]` は円の色になり、書かない集まりには宣言した順に色を配る。",
    "段の中の `set <名札>: <数>` は集まりの数で、初めて書いた段でその集まりの円が現れ、円の外に名前と数が出る。`set <名札> & <名札>: <数>` は重なりの数で、その段の間だけその重なりの区画が光り、重なりの数の札が出る。3 つ全ての重なりは `set <名札> & <名札> & <名札>: <数>` と書く。",
    "区画の中には、全体と重なりの数から出したそれぞれだけの数が出る。後の段で書く重なりがある区画は、その段まで数を出さない。`set none: <数>` はどれにも入らない数で、その段から円の外の枠の左下に出る。重なりの数が重なる集まりの数より大きい行と、集まりが 2 つより少ないか 3 つより多い図は誤りで止まる。",
    "最初の行を `venn <題> [shape: dots]` にすると、円の代わりに点で数える見た目になる。全体の箱に空の点を並べ、段ごとに集まりと重なりの群れへ点が寄り、2つ以上に入る点は入る集まりの色の扇形で塗る。`set none` の点は灰色のまま箱に残る。`[shape: dots, unit: <数>]` で1点の件数を決められ、書かない時は点が100個ほどになる数を図が選ぶ。",
  ],
  en: [
    "To show, step by step, how two or three sets overlap and how many fall in each region, start the first line with `venn <title>`. Declare the sets with `item <id> as <name>` lines before the first `step` line; two sets sit left and right, and three sets sit top left, top right and bottom, as circles of the same size. `[color: <color>]` sets the circle color, and a set without it gets a color in the order declared.",
    "`set <id>: <count>` in a step is the count of a set; its circle appears in the step where it is first written, with the name and count outside the circle. `set <id> & <id>: <count>` is the count of an overlap; that region lights up for that step and a chip shows the count. Write the overlap of all three as `set <id> & <id> & <id>: <count>`.",
    "Each region shows the count only in it, worked out from the totals and the overlaps. A region that depends on an overlap written in a later step shows no count until that step. `set none: <count>` is the count in no set, shown from that step at the bottom left of the frame outside the circles. An overlap larger than a set it overlaps, and a diagram with fewer than 2 or more than 3 sets, are refused.",
    "Start the first line with `venn <title> [shape: dots]` to count with dots instead of circles. Empty dots wait in the box of the whole, each step moves dots into a cluster for each set and each overlap, and a dot in two or more sets is painted in slices of their colors. The dots of `set none` stay grey in the box. `[shape: dots, unit: <count>]` sets how many each dot stands for, and without it the diagram picks a number that makes about 100 dots.",
  ],
};
