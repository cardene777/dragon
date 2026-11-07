/** 見本帳の部品の頁で、段の要点の語を使う見本を探す関数 (#3464)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:gist": (v) => v.diagram.steps.some((step) => step.gist !== undefined),
} satisfies BlockUses;
