/** 見本帳の部品の頁の、取り消しの説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。段の中の revert <者>: <理由> で今いちばん内側の呼び出しが落ち、その内側の変更が元へ戻る。",
  en: "Pipe diagrams only. revert <who>: <reason> in a step makes the innermost call fail, and the changes inside it are undone.",
};
