/** 見本帳の部品の頁で、待ち行列の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:queue": (v) => v.tryParts("queue").length > 0,
  "attr:queue.order": (v) => v.tryParts("queue").some((p) => p.order !== undefined),
} satisfies BlockUses;
