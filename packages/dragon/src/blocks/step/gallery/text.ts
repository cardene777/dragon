/** 見本帳の一覧の、段の名前と説明 (#3345) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "段", desc: "図を区切る段。段ごとに本文と打つ命令を書き、1 段ずつ送って見る。view で、枠が段を追うか全体を止めて見せるかを選ぶ。" },
  en: { name: "Step", desc: "A step of the diagram, with its own text and command, played one at a time. view picks whether the frame follows the step or holds the whole diagram." },
};
