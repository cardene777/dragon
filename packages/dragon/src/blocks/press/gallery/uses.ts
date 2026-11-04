/** 見本帳の部品の頁で、釦の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:press": (v) => v.tryParts("press").length > 0 || v.events.some((e) => e.type === "press"),
  /** 釦の `from` と `into` と `take` は必ず書くので、釦があるかで決める */
  "attr:press.from": (v) => v.tryParts("press").length > 0,
  "attr:press.into": (v) => v.tryParts("press").length > 0,
  "attr:press.take": (v) => v.tryParts("press").length > 0,
  "attr:press.at": (v) => v.tryParts("press").some((p) => p.at !== undefined),
} satisfies BlockUses;
