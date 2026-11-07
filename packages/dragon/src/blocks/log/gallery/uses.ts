/** 見本帳の部品の頁で、記録の列の語を使う見本を探す関数 (#3441)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:log": (v) => v.tryParts("log").length > 0,
  /** all と yes と no は 3 つ揃えて書くので、記録の列が印の決め方を持つかで決める */
  "attr:log.all": (v) => v.tryParts("log").some((p) => p.all !== undefined),
  "attr:log.yes": (v) => v.tryParts("log").some((p) => p.all !== undefined),
  "attr:log.no": (v) => v.tryParts("log").some((p) => p.all !== undefined),
} satisfies BlockUses;
