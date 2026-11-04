/** 見本帳の部品の頁で、始まりと終わりの語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:state": (v) => v.diagram.kind === "state",
  "edge:start": (v) => v.edges.some((e) => e.from === "start"),
  "edge:finish": (v) => v.edges.some((e) => e.to === "finish"),
} satisfies BlockUses;
