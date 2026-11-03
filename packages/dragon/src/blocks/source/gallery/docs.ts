/** 使い方の頁の「段」の節に置く、出典の段落 (#3345) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "steps",
  ja: ["`source <名前> [url: <URL>]` の行は、その段の出典になる。1 つの段に何行でも書け、図と見える語りには出さず、読み上げの段の一覧に名前の link で出る。URL の形は箱の飛び先と同じ。"],
  en: [
    "A `source <name> [url: <URL>]` line is a source for that step. A step can have any number of them. They stay out of the diagram and the shown text, and appear as links named by the source in the step list that screen readers read. The URL takes the same forms as a box link.",
  ],
};
