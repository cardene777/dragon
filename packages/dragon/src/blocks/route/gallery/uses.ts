/** 見本帳の部品の頁で、網の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:try": (v) => v.diagram.kind === "try",
  "head:route": (v) => v.tryParts("route").length > 0,
  /** 網の `from` と `to` は必ず書くので、網があるかで決める */
  "attr:route.from": (v) => v.tryParts("route").length > 0,
  "attr:route.to": (v) => v.tryParts("route").length > 0,
} satisfies BlockUses;
