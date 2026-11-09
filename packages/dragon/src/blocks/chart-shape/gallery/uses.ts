/** 見本帳の部品の頁で、量の図の見た目の語を使う見本を探す関数 (#3560)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  /** 量の図は見た目を必ず書くので、量の図の欄があるかで決める */
  "attr:diagram.shape": (v) => v.diagram.chart !== undefined,
} satisfies BlockUses;
