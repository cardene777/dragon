/** 使い方の頁の「配管の図」の節の、値の札の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`write <者>: <名前> <値>` は値の札を書き替え、前の値を消し線で残す。書き替える札の持ち主は開いている呼び出しから決まり、処理を借りる呼び出しの内側では呼んだ側の札を書き替える。",
  ],
  en: [
    "`write <writer>: <name> <value>` rewrites a value card and keeps the old value struck through. The owner of the card follows the open calls, so inside a call that borrows code the caller's card is rewritten.",
  ],
};
