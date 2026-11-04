/** 見本帳の部品の頁で、封の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:seal": (v) => v.events.some((e) => e.type === "seal"),
  "head:open": (v) => v.events.some((e) => e.type === "open"),
} satisfies BlockUses;
