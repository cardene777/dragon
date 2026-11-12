/** 見本帳の部品の頁で、箱の上限の語を使う見本を探す関数 (#3624)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:box.limit": (v) => (v.diagram.blocks.box ?? []).some((b) => b.limit !== undefined),
} satisfies BlockUses;
