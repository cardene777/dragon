/** 使い方の頁の「配管の図」の節の、呼び出しの管の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`<呼ぶ者> -> <呼ばれる者>: <字>` は呼び出しで、名札の上を走る呼び出しの管を開き、深くなるごとに管が 1 段下がる。`return <戻る者>: <値>` は今いちばん内側で開いている呼び出しを閉じ、戻る値を管の上の札に出す。ほかの者を書いた行は、その名前を指して止まる。一番外の呼び出しが戻った段で、暫定だった変更が全て確定の緑に替わる。",
  ],
  en: [
    "`<caller> -> <callee>: <text>` is a call. It opens a call pipe that runs above the name cards, one level lower for each deeper call. `return <returner>: <value>` closes the innermost open call and shows the returned value on the pipe. A line that names anyone else stops at that name. When the outermost call returns, every pending change turns final green.",
  ],
};
