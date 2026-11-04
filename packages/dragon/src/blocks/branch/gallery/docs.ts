/** 使い方の頁の「枝分かれの図」の節の、枝を切る行と札を動かす線の段落 (#3347) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "git",
  ja: ["`<枝> from <commit>` でその commit から枝を切る。`<札> -> <commit>` は commit を作らずに枝の札か `HEAD` を動かし、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit (例の C) は点線の丸に変わる。"],
  en: ["`<branch> from <commit>` cuts a branch at that commit. `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more (C in the example) turns into a dotted circle."],
};
