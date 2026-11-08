/** 見本帳の部品の頁の、イベントの説明 (#3389、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。段の中の emit <者>: <名前>(<引数>, ...) で、図の上の端にイベントの札が積まれる。引数は出した段だけ出る。",
  en: "Pipe diagrams only. emit <who>: <name>(<args>, ...) in a step stacks an event card at the top of the figure. Arguments show only in that step.",
};
