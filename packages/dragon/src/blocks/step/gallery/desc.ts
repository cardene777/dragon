/** 見本帳の部品の頁の、段の説明 (#3345、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "図を区切る段。段ごとに本文と打つ命令を書き、1 段ずつ送って見る。view で、枠が段を追うか全体を止めて見せるかを選ぶ。",
  en: "A step of the diagram, with its own text and command, played one at a time. view picks whether the frame follows the step or holds the whole diagram.",
};
