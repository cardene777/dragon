/** 見本帳の部品の頁で、枝を消す語を使う見本を探す関数 (#3632)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:delete": (v) => v.events.some((e) => e.type === "delete"),
} satisfies BlockUses;
