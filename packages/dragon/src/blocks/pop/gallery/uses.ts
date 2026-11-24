/** 見本帳の部品の頁で、押すと出る札の語を使う見本を探す関数 (#3877)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:diagram.note": (v) => v.diagram.note !== undefined,
  "attr:box.example": (v) => (v.diagram.blocks.box ?? []).some((b) => b.example !== undefined),
} satisfies BlockUses;
