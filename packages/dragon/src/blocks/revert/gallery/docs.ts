/** 使い方の頁の「配管の図」の節の、取り消しの段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`revert <者>: <理由>` は今いちばん内側の呼び出しを落とし、その呼び出しの内側の変更だけを取り消しの印を付けて元へ戻す。呼んだ側は続けて次の行を書ける。",
  ],
  en: [
    "`revert <who>: <reason>` makes the innermost call fail and undoes only the changes inside it, marked as undone. The caller can go on with the next line.",
  ],
};
