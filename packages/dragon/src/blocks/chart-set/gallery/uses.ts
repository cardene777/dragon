/** 見本帳の部品の頁で、量の図の値の語を使う見本を探す関数 (#3560)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  /** 量の図の値の出来事。中身の帯の `set` の行は中身の帯のブロックが受け持つ */
  "head:set": (v) => v.events.some((e) => e.type === "set"),
} satisfies BlockUses;
