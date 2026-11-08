/** 見本帳の部品の頁の、当て直しの説明 (#3347、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "枝分かれの図だけの部品。on <枝> の後ろに copy <commit> を書くと、元の commit と同じ変更を当て直した commit になり、元から点線で結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。",
  en: "Git graphs only. Add copy <commit> after on <branch> to replay the same change as that commit, joined to it by a dotted line. Use it for commits a rebase rewrites; branch refs do not move.",
};
