/** 見本帳の部品の頁の、線の名前の説明 (#3345、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "線に添える名前。side で、上、下、左、右のどこに置くかを選ぶ。",
  en: "The name beside an edge. side puts it above, below, left or right.",
};
