/** 使い方の頁の「配管の図」の節の、イベントの段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`emit <者>: <名前>(<引数>, ...)` はイベントで、図の上の端に `<者の名前>.<名前>` の札を積み、出した段だけ引数を出す。",
  ],
  en: [
    "`emit <who>: <name>(<args>, ...)` is an event. It stacks a `<party name>.<name>` card at the top of the figure and shows the arguments only in that step.",
  ],
};
