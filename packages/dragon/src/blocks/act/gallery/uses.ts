/** 見本帳の部品の頁で、箱の中の処理の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:act": (v) => v.events.some((e) => e.type === "action"),
} satisfies BlockUses;
