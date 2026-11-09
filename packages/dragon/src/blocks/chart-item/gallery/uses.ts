/** 見本帳の部品の頁で、量の図の項目の語を使う見本を探す関数 (#3560)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:chart": (v) => v.diagram.kind === "chart",
  /** 量の図は項目を必ず宣言するので、量の図かで決める。列の図と試す図の `item` の行はチップのブロックと入力の帯のブロックが受け持つ */
  "head:item": (v) => (v.diagram.chart?.items.length ?? 0) > 0,
  "attr:item.color": (v) => (v.diagram.chart?.items ?? []).some((item) => item.color !== undefined),
} satisfies BlockUses;
