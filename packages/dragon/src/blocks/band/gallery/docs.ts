/** 使い方の頁の「量の行き先の図」の節の、出どころと行き先と量の帯の段落 (#3626) と、段ごとの帯の見た目の段落 (#3641) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "sankey",
  ja: [
    "1 つの量がどこへどれだけ分かれるかを段ごとに見せる時は、最初の行を `sankey <題>` にする。出どころと行き先は最初の `step` の行より前に `box <名札> as <名前>` の行で宣言する。入る線の無い箱が左の列に並び、行き先は出どころの右の列に並ぶ。`[color: <色>]` は棒と、その箱へ入る帯の色になる。",
    "段の中の `<出どころ> -> <行き先>: <量>` の行で、その段で出どころの棒から行き先の棒へ帯が伸び、量の札が帯を渡る。線の名前の初めの数が量で、`40%` は 40、`1,200円` は 1200 と読む。帯の幅は出どころの棒のうちその量が占める割合の分になり、出どころの棒の上から書いた順に積む。",
    "出どころの無い箱の量は出る量の和で、行き先の量は入る量の和になる。線の名前が数で始まらない線、流れを辿ると元の箱へ戻る線、入る量より出る量の和が大きい箱は誤りで止まる。1 つの図の量は同じ単位で書く。",
    "最初の行を `sankey <題> [shape: rows]` にすると、段ごとに図の幅いっぱいの帯を1行ずつ上から積む。各行はその段までの線で分かれた区画に分かれ、区画の幅は出どころの無い箱の量の和に比べた量になる。その段で新しく分かれた区画と最後の行の区画に名前と量が出て、前の段から続いている区画は字を出さない薄い帯になる。出どころの無い箱のまだ分けていない残りは灰色の帯に `残り16時間` の形で出て、上の行から下りる帯と量の札は新しく分かれた区画にだけ引く。名前が区画に入らない時は、その行の帯の下に色の印と名前が並ぶ。",
  ],
  en: [
    "To show, step by step, where one amount goes and how much goes to each place, start the first line with `sankey <title>`. Declare the sources and targets with `box <id> as <name>` lines before the first `step` line. Boxes no line goes into sit in the left column, and each target sits in a column to the right of its source. `[color: <color>]` sets the color of the bar and of the bands going into that box.",
    "A `<source> -> <target>: <amount>` line in a step grows a band from the source bar to the target bar in that step, and an amount chip travels along it. The number at the start of the label is the amount: `40%` reads as 40 and `1,200` as 1200. A band takes the share of the source bar that its amount makes up, and the bands stack down the source bar in the order written.",
    "A box with no source holds the sum of what leaves it, and a target holds the sum of what comes in. A label that does not start with a number, a line whose flow leads back to a box it came from, and a box sending out more than comes in are refused. Write every amount in one diagram in the same unit.",
    "Start the first line with `sankey <title> [shape: rows]` to stack one full-width bar per step from the top. Each row is split into the sections that the lines so far have cut, and a section is as wide as its share of the total of the boxes with no source. Sections that split off in that step and those of the last row show their name and amount, and sections carried over from the step before are faint bars with no text. What a box with no source has not handed out yet is a gray bar that reads like `16h left`, and the band coming down from the row above and the amount chip are drawn only for the new sections. A name that does not fit its section is listed under that row's bar with a color mark.",
  ],
};
