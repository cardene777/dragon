/** 見本帳の部品の頁で、commitの語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:commit": (v) => v.commits.length > 0,
  "attr:commit.hash": (v) => v.commits.some((c) => c.hash !== undefined),
  "attr:commit.note": (v) => v.commits.some((c) => c.note !== undefined),
} satisfies BlockUses;
