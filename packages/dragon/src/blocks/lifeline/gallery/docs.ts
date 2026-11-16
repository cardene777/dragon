/** 使い方の頁の「箱」の節の、箱の並びと生存線の段落 (#3345) と、時系列図の見た目を選ぶ段落 (#3720) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "boxes",
  ja: [
    "箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。",
    "時系列図の最初の行に `[shape: pipe]` を足すと、配管の図の部品で描く見た目になり、縦の線は管になる。この見た目では `hold <持ち主>: <量> <トークン>` の行で、箱の下に値の持ち分を置ける。書かない図は今の見た目のまま描く。",
  ],
  en: [
    "Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them.",
    "Adding `[shape: pipe]` to the first line of a sequence diagram draws the vertical lines as pipes and the boxes with the parts of the pipe diagram. In this look, a `hold <owner>: <amount> <token>` line puts the owner's balance under the box. A diagram without it keeps the current look.",
  ],
};
