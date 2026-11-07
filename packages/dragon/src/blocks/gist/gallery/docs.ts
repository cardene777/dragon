/** 使い方の頁の「配管の図」の節の、段の要点の段落 (#3464) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "`gist <要点>` はその段の要点で、図の下の段の矢印の後ろに要点の札を出す。配管の図は段の本文を図の下に出さないので、本文だけで伝えていた要点はここに書く。1 つの段に 1 行まで書ける。",
  ],
  en: [
    "`gist <key point>` is the key point of the step. It shows a note after the step's arrows under the figure. A pipe diagram does not show the step body under the figure, so write here a point the body alone would carry. A step takes at most one.",
  ],
};
