/** 見本帳の部品の頁の、ETHの送金の説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。呼び出しの行に [value: <量> ETH] を付けると、呼び出しに ETH を添えて送る。",
  en: "Pipe diagrams only. Add [value: <amount> ETH] to a call line to send ETH along with the call.",
};
