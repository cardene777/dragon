/** 見本帳の部品の頁で、チップの語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:lineup": (v) => v.diagram.kind === "lineup",
  "head:item": (v) => (v.diagram.blocks.item ?? []).length > 0,
  "attr:item.color": (v) => v.lineupItems.some((i) => i.color !== undefined),
  "attr:item.label": (v) => v.lineupItems.some((i) => i.label !== undefined),
} satisfies BlockUses;
