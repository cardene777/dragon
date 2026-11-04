/** 見本帳の部品の頁で、飛び先の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:box.link": (v) => (v.diagram.blocks.box ?? []).some((b) => b.link !== undefined),
} satisfies BlockUses;
