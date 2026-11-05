/** 使い方の頁の「配管の図」の節の、畳みの段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "呼び出しの行に `[fold]` を付けると、その呼び出しの内側の段を 1 つの箱に畳み、内側の段の数と、内側にしか出ない関係者の数を出す。畳んだ間はその関係者の列を描かない。箱を押すと内側の段を開く。",
  ],
  en: [
    "Add `[fold]` to a call line and the steps inside that call fold into one box that shows how many steps are inside and how many parties appear only there. Those parties get no column while the box is closed. Click the box to open those steps.",
  ],
};
