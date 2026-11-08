/** 見本帳の部品の頁の、畳みの説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。呼び出しの行に [fold] を付けると、その呼び出しの内側の段が 1 つの箱に畳まれる。箱を押すと開く。",
  en: "Pipe diagrams only. Add [fold] to a call line and the steps inside that call fold into one box. Click the box to open it.",
};
