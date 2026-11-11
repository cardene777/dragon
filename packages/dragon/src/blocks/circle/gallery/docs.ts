/** 使い方の頁の「集合の重なりの図」の節の、集まりと数と重なりの段落 (#3620) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "venn",
  ja: [
    "2 つか 3 つの集まりの重なりと、重なった区画ごとの数を段ごとに見せる時は、最初の行を `venn <題>` にする。集まりは最初の `step` の行より前に `item <名札> as <名前>` の行で宣言し、2 つの集まりは左右に、3 つの集まりは左上と右上と下に同じ大きさの円で並ぶ。`[color: <色>]` は円の色になり、書かない集まりには宣言した順に色を配る。",
    "段の中の `set <名札>: <数>` は集まりの数で、初めて書いた段でその集まりの円が現れ、円の外に名前と数が出る。`set <名札> & <名札>: <数>` は重なりの数で、その段の間だけその重なりの区画が光り、重なりの数の札が出る。3 つ全ての重なりは `set <名札> & <名札> & <名札>: <数>` と書く。",
    "区画の中には、全体と重なりの数から出したそれぞれだけの数が出る。後の段で書く重なりがある区画は、その段まで数を出さない。`set none: <数>` はどれにも入らない数で、その段から円の外の枠の左下に出る。重なりの数が重なる集まりの数より大きい行と、集まりが 2 つより少ないか 3 つより多い図は誤りで止まる。",
  ],
  en: [
    "To show, step by step, how two or three sets overlap and how many fall in each region, start the first line with `venn <title>`. Declare the sets with `item <id> as <name>` lines before the first `step` line; two sets sit left and right, and three sets sit top left, top right and bottom, as circles of the same size. `[color: <color>]` sets the circle color, and a set without it gets a color in the order declared.",
    "`set <id>: <count>` in a step is the count of a set; its circle appears in the step where it is first written, with the name and count outside the circle. `set <id> & <id>: <count>` is the count of an overlap; that region lights up for that step and a chip shows the count. Write the overlap of all three as `set <id> & <id> & <id>: <count>`.",
    "Each region shows the count only in it, worked out from the totals and the overlaps. A region that depends on an overlap written in a later step shows no count until that step. `set none: <count>` is the count in no set, shown from that step at the bottom left of the frame outside the circles. An overlap larger than a set it overlaps, and a diagram with fewer than 2 or more than 3 sets, are refused.",
  ],
};
