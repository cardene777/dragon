/** 見本帳の部品の頁で、拡大の帯の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:zoom": (v) => v.diagram.blocks.zoom !== undefined,
  "attr:edge.at": (v) => v.edges.some((e) => e.at !== undefined),
  "attr:edge.into": (v) => v.edges.some((e) => e.into !== undefined),
} satisfies BlockUses;
