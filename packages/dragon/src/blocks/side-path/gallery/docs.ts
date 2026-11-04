/** 使い方の頁の「状態遷移図」の節の、通らない道と脇道の段落 (#3347) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "state",
  ja: ["最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引き、運ぶ物を走らせない。どの段も辿り着かない状態 (例のキャンセル) は、図の右上の脇道の囲みに入る。"],
  en: ["Lines written before the first `step` line are paths the diagram could take but does not take this time. They are drawn dotted, and nothing travels on them. A state that no step reaches (Cancelled in the example) goes in the side-path box at the top right."],
};
