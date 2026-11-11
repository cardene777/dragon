/** 見本帳の部品の頁の、枝を消す部品の説明 (#3632)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "枝分かれの図だけの部品。段の中で delete <枝> と書くと、その枝を消す。消した段から後は枝の札が消え、どの枝からも辿れなくなった commit は点線の丸になる。HEAD が指している枝は消せない。",
  en: "Git graphs only. Write delete <branch> in a step to delete that branch. From that step on its ref is gone, and a commit that no branch can reach any more turns into a dotted circle. The branch HEAD points at cannot be deleted.",
};
