/** 見本帳の部品の頁で、節目の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:point": (v) => (v.diagram.blocks.point ?? []).length > 0,
  "attr:note.color": (v) => v.events.some((e) => e.type === "swap" && e.color !== undefined),
} satisfies BlockUses;
