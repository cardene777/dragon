/** 使い方の頁の「配管の図」の節の、呼び出しの種類の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "呼び出しの行に `[call: delegate]` を付けると処理を借りる呼び出しになり、管は 2 本線で描き、内側の `write` は呼んだ側の値を書き替える。`[call: static]` は書き込めない呼び出しで、管は半分の太さになり、内側で残高と値とイベントを変える行は止まる。",
  ],
  en: [
    "Add `[call: delegate]` to a call line for a call that borrows code. Its pipe is drawn as a double line, and a `write` inside it rewrites the caller's values. `[call: static]` is a call that cannot write. Its pipe is half as thick, and a line inside it that changes a balance, a value or an event stops.",
  ],
};
