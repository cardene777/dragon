/** 見本帳の一覧の、取り消しの名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "取り消し",
    desc: "配管の図だけの部品。段の中の revert <者>: <理由> で今いちばん内側の呼び出しが落ち、その内側の変更が元へ戻る。",
  },
  en: {
    name: "Revert",
    desc: "Pipe diagrams only. revert <who>: <reason> in a step makes the innermost call fail, and the changes inside it are undone.",
  },
};
