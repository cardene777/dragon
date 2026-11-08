/** 見本帳の部品の頁の、枝の説明 (#3347、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "枝分かれの図だけの部品。branch の行で枝を上から順に宣言すると、枝ごとに横長の帯が並ぶ。段の中で <枝> from <commit> と書くと、その commit から枝を切る。",
  en: "Git graphs only. Declare branches top to bottom with branch lines, and each gets its own lane. Inside a step, <branch> from <commit> cuts the branch at that commit.",
};
