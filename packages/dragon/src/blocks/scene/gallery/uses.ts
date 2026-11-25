/**
 * 見本帳の部品の頁で、場面の語を使う見本を探す関数 (#3878)。鍵は記法の語で、部品の頁はこの順に語を並べる。
 * 場面を書いた図の原本は、1 行目の `scenes` を書かない時も見せ方 (`stack`) を持つので、`scenes` の語は場面を持つ図が使う
 */
import type { BlockUses } from "../../gallery";

export const uses = {
  "head:scene": (v) => (v.diagram.scenes?.list.length ?? 0) > 0,
  "head:stop": (v) => (v.diagram.scenes?.list ?? []).some((scene) => scene.stop !== undefined),
  "attr:diagram.scenes": (v) => v.diagram.scenes !== undefined,
} satisfies BlockUses;
