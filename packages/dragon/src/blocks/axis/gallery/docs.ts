/** 使い方の頁の「2つの軸で置く図」の節の、軸と区画の段落 (#3622) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "matrix",
  ja: [
    "2つの物差しで課題を4つの区画に分ける時は、最初の行を `matrix <題>` にする。最初の `step` より前に `axis <名前> [from: <小さい側>, to: <大きい側>]` を横の軸、縦の軸の順に 2 行書く。横の軸は区画の下を左から右へ、縦の軸は区画の左を下から上へ矢印で引き、軸の名前と両端の字を軸の外に出す。",
    "区画は `box <名札> as <名前>` でちょうど 4 つ書き、書いた順に左上、右上、左下、右下に置いて、区画の左上に名前を出す。`[note: <字>]` を書くと名前の下に小さな字を出し、区画の色は置き場所で決まるので、ほかの属性は書けない。軸が 2 本でないか区画が 4 つでない図は、どの行が多いか足りないかを示して断る。線と中身の帯の行は書けない。",
  ],
  en: [
    "To sort items into four areas by two measures, start the first line with `matrix <title>`. Before the first `step`, write `axis <name> [from: <low end>, to: <high end>]` twice, the horizontal axis first and then the vertical one. The horizontal arrow runs below the areas from left to right and the vertical arrow left of them from bottom to top, with the axis name and both ends outside the axis.",
    "Write exactly four areas as `box <id> as <name>`; they go top left, top right, bottom left and bottom right in written order, with the name at the top left of each area. `[note: <text>]` shows a small line under the name; an area's color comes from its spot, so it takes no other attribute. A matrix without exactly two axes or four areas is refused, naming the line that is extra or the spot that is short. Line and strip lines are not allowed.",
  ],
};
