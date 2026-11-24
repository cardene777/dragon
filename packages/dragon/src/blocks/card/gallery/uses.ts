/** 見本帳の部品の頁で、持ち主ごとのカードの語を使う見本を探す関数 (#3846)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:cards": (v) => v.diagram.kind === "cards",
  "head:refuse": (v) => v.events.some((e) => e.type === "refuse"),
  "attr:box.mark": (v) => (v.diagram.blocks.box ?? []).some((b) => b.mark !== undefined),
} satisfies BlockUses;
