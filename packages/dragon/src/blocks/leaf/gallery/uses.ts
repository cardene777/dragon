/** 見本帳の部品の頁で、葉と札の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:tree": (v) => v.diagram.kind === "tree",
  "head:leaf": (v) => v.events.some((e) => e.type === "leaf"),
  "attr:leaf.hash": (v) => v.events.some((e) => e.type === "leaf" && e.hash !== undefined),
} satisfies BlockUses;
