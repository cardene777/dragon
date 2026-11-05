/** 見本帳の一覧の、換算の名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "換算",
    desc: "配管の図だけの部品。段の中の calc <者>: <入る値> -> <出る値> で、行う者の下に入る値と出る値と比率の札が出る。",
  },
  en: {
    name: "Conversion",
    desc: "Pipe diagrams only. calc <who>: <in> -> <out> in a step shows a card with the input, the output and the rate under the converter.",
  },
};
