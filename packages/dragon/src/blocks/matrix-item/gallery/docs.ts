/** 使い方の頁の「2つの軸で置く図」の節の、課題の段落 (#3622) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "matrix",
  ja: [
    "分ける課題は最初の `step` より前に `item <名札> as <名前>` と書き、区画の左の「まだ置いていない」の一覧に書いた順に並ぶ。段の中に `line <区画>: <課題>` と書くと、その段で課題の札が一覧から区画へ滑り、区画が光る。`,` で区切って 1 行に何枚でも置け、置いた札は次の段も区画に残る。後の段で別の区画へ書くと置き直せる。",
    "課題の行に `[x: <横>, y: <縦>]` で 0 から 10 の点数を小数 1 桁まで書くと、段の中の `line: <課題>` で区画を書かずに、点数から決まる区画へ置ける。軸ごとに 5 以上を大きい側に数える。点数を持つ課題を `line <区画>: <課題>` で置く行は、点数の区画と同じ時だけ読む。",
    "`line` に書いた区画か課題が無い時と、1 行に同じ課題を 2 度書いた時は、その名前の位置を示して断る。`as <名前>` を省くと名札がそのまま名前になる。",
  ],
  en: [
    "Declare the items to sort before the first `step` as `item <id> as <name>`; they wait in the \"Not placed yet\" list left of the areas in written order. Write `line <area>: <item>` in a step and the item's card slides from the list into that area while the area lights up. List several items with `,` on one line; a placed card stays in its area in later steps, and writing it to another area in a later step moves it there.",
    "Give an item scores from 0 to 10 with at most one decimal place as `[x: <across>, y: <up>]`, and `line: <item>` in a step places it without naming an area, into the area its scores fall in. A score of 5 or more counts as the large side on each axis. A `line <area>: <item>` for a scored item is read only when the area matches its scores.",
    "A `line` that names an unknown area or item, or names the same item twice, is refused at that name. Leave out `as <name>` and the id becomes the name.",
  ],
};
