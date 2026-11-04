/** 見本帳の部品の頁で、色の役の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:box.color": (v) => (v.diagram.blocks.box ?? []).some((b) => b.color !== undefined),
} satisfies BlockUses;
