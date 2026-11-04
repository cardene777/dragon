/** 見本帳の部品の頁で、印の列の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:row": (v) => (v.diagram.blocks.row ?? []).length > 0,
  "attr:row.color": (v) => (v.diagram.blocks.row ?? []).some((r) => r.color !== undefined),
  "attr:row.empty": (v) => (v.diagram.blocks.row ?? []).some((r) => r.empty !== undefined),
  "head:mark": (v) => v.events.some((e) => e.type === "mark"),
  "attr:mark.color": (v) => v.events.some((e) => e.type === "mark"),
} satisfies BlockUses;
