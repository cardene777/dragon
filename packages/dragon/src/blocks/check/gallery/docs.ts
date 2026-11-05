/** 使い方の頁の「配管の図」の節の、確認の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`check <者>: <左> <比べ方> <右>` は確認で、その段だけ行う者の下に計器を出し、後は名札の右上と図の上の端に印を残す。比べ方は `>=`、`<=`、`==`、`!=`、`>`、`<`。両側が数なら dragon が比べ、数でない確認は `[fail]` を書いた時だけ落ちる。",
  ],
  en: [
    "`check <who>: <left> <op> <right>` is a check. It shows a gauge under the checker in that step, then leaves a mark on the name card and at the top of the figure. The op is `>=`, `<=`, `==`, `!=`, `>` or `<`. dragon compares numbers itself, and a check of anything else fails only when `[fail]` is written.",
  ],
};
