/** 見本帳の一覧の、当て直しの名前と説明 (#3347) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: { name: "当て直し", desc: "枝分かれの図だけの部品。on <枝> の後ろに copy <commit> を書くと、元の commit と同じ変更を当て直した commit になり、元から点線で結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。" },
  en: { name: "Replay", desc: "Git graphs only. Add copy <commit> after on <branch> to replay the same change as that commit, joined to it by a dotted line. Use it for commits a rebase rewrites; branch refs do not move." },
};
