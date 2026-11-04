/** 見本帳の部品の頁で、当て直しの語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "git:copy": (v) => v.commits.some((c) => c.copy !== undefined),
} satisfies BlockUses;
