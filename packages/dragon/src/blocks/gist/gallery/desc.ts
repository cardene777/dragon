/** 見本帳の部品の頁の、段の要点の説明 (#3464、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "配管の図だけの部品。段の中の gist <要点> で、図の下の段の矢印の後ろに要点の札が出る。1 つの段に 1 行まで書ける。",
  en: "Pipe diagrams only. gist <key point> in a step shows a key point note after the step's arrows under the figure. A step takes at most one.",
};
