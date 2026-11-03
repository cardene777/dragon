/** 使い方の頁の「運ぶ物」の節の段落 (#3345) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "carry",
  ja: [
    "線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。",
    "線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。",
    "`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。",
  ],
  en: [
    "Something runs along each line to show what was carried. Without any option, an envelope travels.",
    "Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.",
    "`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands.",
  ],
};
