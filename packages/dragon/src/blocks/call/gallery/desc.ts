/** 見本帳の部品の頁の、呼び出しの種類の説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。呼び出しの行に [call: delegate] を付けると処理を借りる呼び出し、[call: static] を付けると書き込めない呼び出しになる。",
  en: "Pipe diagrams only. Add [call: delegate] to a call line for a call that borrows code, or [call: static] for a call that cannot write.",
};
