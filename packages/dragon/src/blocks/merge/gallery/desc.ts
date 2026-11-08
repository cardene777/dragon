/** 見本帳の部品の頁の、merge commit の説明 (#3347、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "枝分かれの図だけの部品。on <枝> の後ろに merge <枝> を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になる。取り込む先の札だけが進む。",
  en: "Git graphs only. Add merge <branch> after on <branch> to make a commit with two parents: the tip of the target and the tip of the merged branch. Only the target's ref moves.",
};
