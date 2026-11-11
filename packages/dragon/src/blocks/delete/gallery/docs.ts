/** 使い方の頁の「枝分かれの図」の節の、枝を消す行の段落 (#3632) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "git",
  ja: [
    "`delete <枝>` で枝を消す。消した段から後はその枝の札が消え、どの枝からも辿れなくなった commit は点線の丸に変わる。枝の帯は残る。`HEAD` が指している枝は消せないので、先に `HEAD -> <commit>` で離し、残す枝の札をその commit へ動かして `HEAD` をその枝へ戻す。消した枝へは commit を積めない。",
  ],
  en: [
    "`delete <branch>` deletes a branch. From that step on its ref is gone, and a commit that no branch can reach any more turns into a dotted circle. The branch's lane stays. The branch `HEAD` points at cannot be deleted, so first detach `HEAD` with `HEAD -> <commit>` and move the ref of a branch you keep to that commit, which puts `HEAD` back on that branch. No commit can be added to a deleted branch.",
  ],
};
