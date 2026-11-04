/** 見本帳の部品の頁で、入力の帯の語を使う見本を探す関数 (#3350)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:ask": (v) => v.tryParts("ask").length > 0 || v.events.some((e) => e.type === "ask"),
  /** 入力の帯の `into` は必ず書くので、入力の帯があるかで決める */
  "attr:ask.into": (v) => v.tryParts("ask").length > 0,
  "attr:ask.via": (v) => v.tryParts("ask").some((p) => p.via !== undefined),
} satisfies BlockUses;
