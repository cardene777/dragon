/** 使い方の頁の「状態遷移図」の節の、始まりと終わりの印の段落 (#3347) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "state",
  ja: ["線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。`start` と `finish` は箱の名札に使えない。"],
  en: ["Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark. `start` and `finish` cannot be used as box ids."],
};
