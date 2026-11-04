/** 見本帳の部品の頁で、中身の帯と欄の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:strip": (v) => v.diagram.blocks.strip !== undefined,
  "head:set": (v) => v.events.some((e) => e.type === "strip"),
  "attr:set.tag": (v) => v.events.some((e) => e.type === "strip" && e.tag !== undefined),
} satisfies BlockUses;
