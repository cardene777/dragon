/** 見本帳の一覧の、merge commit の名前と説明 (#3347) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "merge commit", desc: "枝分かれの図だけの部品。on <枝> の後ろに merge <枝> を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になる。取り込む先の札だけが進む。" },
  en: { name: "Merge commit", desc: "Git graphs only. Add merge <branch> after on <branch> to make a commit with two parents: the tip of the target and the tip of the merged branch. Only the target's ref moves." },
};
