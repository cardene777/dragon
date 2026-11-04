/** 見本帳の部品の頁で、出典の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:source": (v) => v.diagram.steps.some((step) => step.sources !== undefined),
  "attr:source.url": (v) => v.diagram.steps.some((step) => step.sources !== undefined),
} satisfies BlockUses;
