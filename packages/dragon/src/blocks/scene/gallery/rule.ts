/** `docs/design/base/GRAMMAR.md` の部品と使い方の表の、場面の名前と止まる理由の行と、分かれる所の点線の行 (#3878) */
import type { BlockRule } from "../../gallery";

export const rule: BlockRule = [
  {
    part: "場面の名前と止まる理由",
    rule: "並べる見せ方では場面ごとの図の上に場面の名前を、stop を書いた場面の図の下に理由の文を、箱の名前と同じ大きさ以上の字で出す。理由の文は場面が stop の段に着いた時に出す",
    name: "`renderScenes` が組む",
  },
  {
    part: "分かれる所の点線",
    rule: "場面が 2 つ以上の並べる見せ方で、場面の最初の段が名指す箱の左の端から 5px 左に、図の上から下まで縦の点線を引く。共通の段の線は灰色、場面の段の線は場面の色 (青、ばら、すみれの順) で描く",
    name: "`renderScenes` が組む",
  },
];
