/** 見本帳の部品の頁で、槽の語を使う見本を探す関数 (#3389)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:pipe": (v) => v.diagram.kind === "pipe",
  "head:hold": (v) => (v.diagram.blocks.hold ?? []).length > 0,
  "head:move": (v) => v.events.some((e) => e.type === "move" && e.from !== undefined && e.to !== undefined),
  // 発行と焼却は、原本では受け手か送り手を省いた move (#3722)
  "head:mint": (v) => v.events.some((e) => e.type === "move" && e.from === undefined),
  "head:burn": (v) => v.events.some((e) => e.type === "move" && e.to === undefined),
  // 置き方を選ぶ `layout` の行は、読む処理をこのブロックが持つ (#3720)
  "head:layout": (v) => v.diagram.layout !== undefined,
} satisfies BlockUses;
