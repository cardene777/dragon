/** 見本帳の一覧の、枝の名前と説明 (#3347) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "枝", desc: "枝分かれの図だけの部品。branch の行で枝を上から順に宣言すると、枝ごとに横長の帯が並ぶ。段の中で <枝> from <commit> と書くと、その commit から枝を切る。" },
  en: { name: "Branch", desc: "Git graphs only. Declare branches top to bottom with branch lines, and each gets its own lane. Inside a step, <branch> from <commit> cuts the branch at that commit." },
};
