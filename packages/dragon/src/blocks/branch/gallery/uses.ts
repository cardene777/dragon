/** 見本帳の部品の頁で、枝の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:git": (v) => v.diagram.kind === "git",
  "head:branch": (v) => (v.diagram.blocks.branch ?? []).length > 0,
  "attr:branch.note": (v) => (v.diagram.blocks.branch ?? []).some((b) => b.note !== undefined),
  "git:from": (v) => v.events.some((e) => e.type === "branch"),
} satisfies BlockUses;
