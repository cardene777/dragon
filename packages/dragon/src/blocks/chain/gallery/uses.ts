/** 見本帳の部品の頁で、機械の列の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:chain": (v) => v.tryParts("chain").length > 0,
  "attr:chain.edit": (v) => v.tryParts("chain").some((p) => p.edit !== undefined),
} satisfies BlockUses;
