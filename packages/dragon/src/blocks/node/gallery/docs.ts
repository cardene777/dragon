/** 使い方の頁の「木の図」の節の、親を組む行の段落 (#3348) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "tree",
  ja: ["`node <名札> of <子>, <子> [hash: <値>]` が親で、`of` の後ろに組む子を並べる。親は子の真ん中の上に置かれ、親と子を木の線が結ぶ。どの親にも組まれなかった箱が根で、上の真ん中に置かれる。根は1つにする。"],
  en: [
    "`node <id> of <child>, <child> [hash: <value>]` is a parent, and the children to join follow `of`. A parent sits above the middle of its children, and tree lines join them. The box that no parent takes is the root and sits at the top in the middle. Keep to one root.",
  ],
};
