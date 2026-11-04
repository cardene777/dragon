/** 見本帳の部品の頁で、目盛りと針の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:time": (v) => v.diagram.kind === "time",
  "head:scale": (v) => v.diagram.blocks.scale !== undefined,
  "attr:scale.from": (v) => v.diagram.blocks.scale?.from !== undefined,
  "head:period": (v) => v.diagram.blocks.period !== undefined,
  "attr:period.from": (v) => v.diagram.blocks.period?.from !== undefined,
  "head:span": (v) => v.spans.length > 0,
  "attr:span.shape": (v) => v.spans.some((e) => e.shape !== undefined),
  "attr:span.color": (v) => v.spans.some((e) => e.color !== undefined),
  "attr:strip.meter": (v) => (v.diagram.blocks.strip?.meters ?? []).length > 0,
} satisfies BlockUses;
