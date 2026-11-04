/** 見本帳の部品の頁で、列の並びの語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:line": (v) => v.events.some((e) => e.type === "line"),
} satisfies BlockUses;
