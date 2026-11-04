/**
 * 使い方の頁の「段」の節に置く、箱の中の処理の段落 (#3345、#3350)。
 * 節の段落はブロックの並びの順に並ぶので、線の節の頭に置かず、段の中で箱に起きることとして段の節に置く
 */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "steps",
  ja: ["`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。"],
  en: ["`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting."],
};
