/** 使い方の頁の「線」の節の、線を起こした操作の番号の段落 (#3720) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "edges",
  ja: [
    "時系列図の線の行に `[op: <番号>]` を足すと、線を起こした操作の番号を線に持たせる。描いた線は `data-op` に段と番号を持ち、図を置いた画面が線と記録やコードの行を結ぶのに使う。ほかの種類の図の線には書けない。",
  ],
  en: [
    "Adding `[op: <number>]` to a line of a sequence diagram gives the line the number of the operation that raised it. The drawn line carries the step and the number in `data-op`, and the page that shows the diagram uses it to link the line to a record or a line of code. Lines of other kinds of diagrams cannot take it.",
  ],
};
