/** 見本帳の部品の頁の、換算の説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。段の中の calc <者>: <入る値> -> <出る値> で、行う者の下に入る値と出る値と比率の札が出る。",
  en: "Pipe diagrams only. calc <who>: <in> -> <out> in a step shows a card with the input, the output and the rate under the converter.",
};
