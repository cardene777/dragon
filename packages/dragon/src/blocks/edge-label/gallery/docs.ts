/** 使い方の頁の「線」の節に置く、線の名前の置き場所の段落 (#3345) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "edges",
  ja: ["線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。"],
  en: ["The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes."],
};
