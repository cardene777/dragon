/** 見本帳の部品の頁で、考えの語を使う見本を探す関数 (#3619)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:mind": (v) => v.diagram.kind === "mind",
  "head:idea": (v) => v.events.some((e) => e.type === "idea"),
  "attr:idea.color": (v) => v.events.some((e) => e.type === "idea" && e.color !== undefined),
} satisfies BlockUses;
