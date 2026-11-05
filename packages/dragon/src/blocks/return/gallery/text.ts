/** 見本帳の一覧の、呼び出しの管の名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "呼び出しの管",
    desc: "配管の図だけの部品。段の中の <呼ぶ者> -> <呼ばれる者>: <字> で名札の上に呼び出しの管が開き、return <戻る者>: <値> で閉じる。深い呼び出しほど管が下がり、一番外の呼び出しが戻ると変更が確定する。",
  },
  en: {
    name: "Call pipe",
    desc: "Pipe diagrams only. <caller> -> <callee>: <text> in a step opens a call pipe above the name cards, and return <returner>: <value> closes it. Deeper calls run lower, and changes become final when the outermost call returns.",
  },
};
