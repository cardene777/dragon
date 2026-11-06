/** 見本帳の部品の頁で、部品を横に並べる語を使う見本を探す関数 (#3429)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:side": (v) => (v.diagram.blocks.side ?? []).length > 0,
} satisfies BlockUses;
