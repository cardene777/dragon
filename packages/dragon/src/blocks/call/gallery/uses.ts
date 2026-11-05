/** 見本帳の部品の頁で、呼び出しの種類の語を使う見本を探す関数 (#3389)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:edge.call": (v) => v.events.some((e) => e.type === "call" && e.call !== undefined),
} satisfies BlockUses;
