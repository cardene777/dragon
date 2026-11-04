/** 見本帳の部品の頁で、merge commitの語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "git:merge": (v) => v.commits.some((c) => c.merge !== undefined),
} satisfies BlockUses;
