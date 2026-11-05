/** 見本帳の部品の頁で、槽の語を使う見本を探す関数 (#3389)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:pipe": (v) => v.diagram.kind === "pipe",
  "head:hold": (v) => (v.diagram.blocks.hold ?? []).length > 0,
  "head:move": (v) => v.events.some((e) => e.type === "move"),
} satisfies BlockUses;
