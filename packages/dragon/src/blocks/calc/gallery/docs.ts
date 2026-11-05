/** 使い方の頁の「配管の図」の節の、換算の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`calc <者>: <入る値> -> <出る値>` は換算で、行う者の下に入る値と出る値と比率の札を出し、同じ者の次の確認の段まで残す。",
  ],
  en: [
    "`calc <who>: <in> -> <out>` is a conversion. It shows the input, the output and the rate under the converter and keeps them until that party's next check.",
  ],
};
