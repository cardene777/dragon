/** 見本帳の部品の頁で、生存線の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:sequence": (v) => v.diagram.kind === "sequence",
} satisfies BlockUses;
