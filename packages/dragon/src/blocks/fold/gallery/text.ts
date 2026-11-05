/** 見本帳の一覧の、畳みの名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "畳み",
    desc: "配管の図だけの部品。呼び出しの行に [fold] を付けると、その呼び出しの内側の段が 1 つの箱に畳まれる。箱を押すと開く。",
  },
  en: {
    name: "Fold",
    desc: "Pipe diagrams only. Add [fold] to a call line and the steps inside that call fold into one box. Click the box to open it.",
  },
};
