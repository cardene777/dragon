/** 見本帳の一覧の、イベントの名前と説明 (#3389) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "イベント",
    desc: "配管の図だけの部品。段の中の emit <者>: <名前>(<引数>, ...) で、図の上の端にイベントの札が積まれる。引数は出した段だけ出る。",
  },
  en: {
    name: "Event",
    desc: "Pipe diagrams only. emit <who>: <name>(<args>, ...) in a step stacks an event card at the top of the figure. Arguments show only in that step.",
  },
};
