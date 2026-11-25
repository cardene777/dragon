/** 使い方の頁の「段」の節の、場面の段落 (#3878) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "steps",
  ja: [
    "手順の図と列の図は、1つの図に場面を3つまで持てる。箱と全ての場面に共通の段は1回だけ書き、その後ろに`scene <名前>`と`end`の間に、分かれる所から先のその場面だけの段を書く。場面が止まる段の中に`stop <理由>`を書くと、場面はその段で止まって理由の文を出す。",
    "見せ方は1行目の`[scenes: stack]`か`[scenes: pick]`で選び、書かなければ`stack`になる。`stack`は場面を縦に並べ、同じ箱を全ての場面で同じ横の位置に描いて、段を送ると全ての場面が同時に進む。共通の段の線は灰色、場面の段の線は場面の色で描き、分かれる所に縦の点線を引く。`pick`は場面の名前の釦を出し、押した場面の1段目に戻ってその場面の段だけを進める。印刷するとどちらも全ての場面を最後の段まで進めて縦に並べる。",
  ],
  en: [
    "Flow and lineup diagrams can hold up to three scenes. Write the boxes and the steps shared by all scenes once, then write each scene's own steps from the point where they split between `scene <name>` and `end`. `stop <reason>` in a step stops that scene there and shows the reason.",
    "Choose how the scenes are shown with `[scenes: stack]` or `[scenes: pick]` on the first line; without it, the diagram uses `stack`. `stack` lines the scenes up top to bottom with each box at the same horizontal place in every scene, and moving on plays all scenes together. Shared steps draw their lines in gray, a scene's own steps in the scene's color, and a vertical dashed line marks where they split. `pick` shows a button per scene name; pressing one goes back to that scene's first step and moves only that scene. When printed, both show every scene at its last step, stacked.",
  ],
};
