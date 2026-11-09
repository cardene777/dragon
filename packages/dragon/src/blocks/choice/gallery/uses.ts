/** 見本帳の部品の頁で、判断の語を使う見本を探す関数 (#3561)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:flow": (v) => v.diagram.kind === "flow",
  "head:choice": (v) => (v.diagram.blocks.choice ?? []).length > 0,
} satisfies BlockUses;
