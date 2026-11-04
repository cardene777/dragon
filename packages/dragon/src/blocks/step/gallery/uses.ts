/** 見本帳の部品の頁で、段の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:step": (v) => v.diagram.steps.length > 0,
  "head:say": (v) => v.diagram.steps.some((step) => step.body !== ""),
  "head:code": (v) => v.diagram.steps.some((step) => step.code !== undefined),
  "attr:diagram.view": (v) => v.diagram.view !== undefined,
} satisfies BlockUses;
