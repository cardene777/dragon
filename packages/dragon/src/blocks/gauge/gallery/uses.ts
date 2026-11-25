/** 見本帳の部品の頁で、量の目盛りの語を使う見本を探す関数 (#3880)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

const gauges = (v: Parameters<BlockUses[string]>[0]) => v.diagram.blocks.gauge ?? [];

export const uses = {
  "head:gauge": (v) => gauges(v).length > 0,
  "attr:gauge.on": (v) => gauges(v).some((g) => g.on !== undefined),
  "attr:gauge.limit": (v) => gauges(v).some((g) => g.limit !== undefined),
  "attr:gauge.unit": (v) => gauges(v).some((g) => g.unit !== undefined),
  "attr:gauge.over": (v) => gauges(v).some((g) => g.over !== undefined),
} satisfies BlockUses;
