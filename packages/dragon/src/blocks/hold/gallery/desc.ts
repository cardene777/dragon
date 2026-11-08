/** 見本帳の部品の頁の、槽の説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。最初の step より前に hold <持ち主>: <量> <トークン> と書くと、持ち主の列の下に槽が並び、水位が量を表す。段の中の move <トークンの Contract>: <量> <送り手> -> <受け手> で残高が移る。",
  en: "Pipe diagrams only. Write hold <owner>: <amount> <token> before the first step and a tank sits under the owner, its level showing the amount. move <token contract>: <amount> <from> -> <to> in a step moves the balance.",
};
