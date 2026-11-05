/** 見本帳の一覧の、呼び出しの種類の名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "呼び出しの種類",
    desc: "配管の図だけの部品。呼び出しの行に [call: delegate] を付けると処理を借りる呼び出し、[call: static] を付けると書き込めない呼び出しになる。",
  },
  en: {
    name: "Call kind",
    desc: "Pipe diagrams only. Add [call: delegate] to a call line for a call that borrows code, or [call: static] for a call that cannot write.",
  },
};
