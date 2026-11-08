/** 見本帳の部品の頁の、commit の説明 (#3347、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "枝分かれの図だけの部品。commit <名札> on <枝> で枝に commit を積み、hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。",
  en: "Git graphs only. commit <id> on <branch> adds a commit to the branch, with its hash and a short note beside the circle. The branch's ref, and HEAD when it points at that branch, move to the new commit.",
};
