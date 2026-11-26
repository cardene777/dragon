/** 使い方の頁の「配管の図」の節の、取り消しの段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`revert <者>: <理由>` は今いちばん内側の呼び出しを落とし、その呼び出しの内側の変更だけを取り消しの印を付けて元へ戻す。呼んだ側は続けて次の行を書ける。",
    "落ちた箱の近くには、桃色の×の印と理由を書いた取り消しの札が、落ちた段の間だけ出る。理由を書かない `revert <者>` の札は取り消しの語を書く。同じ段で内側から外へ連なって落ちる時は連なりの元の箱にだけ札が付き、元の箱が落ちた `check` を書いていれば計器の×と式の札が印になるので札は付かない。",
  ],
  en: [
    "`revert <who>: <reason>` makes the innermost call fail and undoes only the changes inside it, marked as undone. The caller can go on with the next line.",
    "A rose tag with a cross and the reason shows by the failing box during the failing step. A `revert <who>` with no reason writes the undone word on the tag. When calls fail one after another from the inside out in the same step, only the box where the failure started gets the tag, and it gets none when that box wrote a failing `check`, since the gauge's cross and formula already mark it.",
  ],
};
