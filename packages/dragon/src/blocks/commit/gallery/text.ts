/** 見本帳の一覧の、commit の名前と説明 (#3347) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "commit", desc: "枝分かれの図だけの部品。commit <名札> on <枝> で枝に commit を積み、hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。" },
  en: { name: "Commit", desc: "Git graphs only. commit <id> on <branch> adds a commit to the branch, with its hash and a short note beside the circle. The branch's ref, and HEAD when it points at that branch, move to the new commit." },
};
