/** 見本帳の部品の頁で、役の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:role": (v) => (v.diagram.blocks.role ?? []).length > 0,
  "attr:role.note": (v) => (v.diagram.blocks.role ?? []).some((r) => r.note !== undefined),
} satisfies BlockUses;
