/** 見本帳の部品の頁で、集まりの円の語を使う見本を探す関数 (#3620)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:venn": (v) => v.diagram.kind === "venn",
  /** 集合の重なりの図は集まりを必ず宣言するので、集まりを持つかで決める。列の図と試す図と量の図の `item` の行はほかのブロックが受け持つ */
  "head:item": (v) => (v.diagram.blocks.circle?.length ?? 0) > 0,
  "attr:item.color": (v) => (v.diagram.blocks.circle ?? []).some((set) => set.color !== undefined),
} satisfies BlockUses;
