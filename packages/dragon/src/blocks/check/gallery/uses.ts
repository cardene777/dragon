/** 見本帳の部品の頁で、確認の語を使う見本を探す関数 (#3389)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:check": (v) => v.events.some((e) => e.type === "check"),
  "attr:check.fail": (v) => v.events.some((e) => e.type === "check" && e.fail === true),
} satisfies BlockUses;
