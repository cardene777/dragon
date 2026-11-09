/** 見本帳の部品の頁で、作業の棒の語を使う見本を探す関数 (#3562)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:task": (v) => (v.diagram.blocks.task ?? []).length > 0,
  "attr:task.color": (v) => (v.diagram.blocks.task ?? []).some((t) => t.color !== undefined),
} satisfies BlockUses;
