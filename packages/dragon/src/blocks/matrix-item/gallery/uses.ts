/** 見本帳の部品の頁で、2つの軸で置く図の課題の語を使う見本を探す関数 (#3622)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  /** 2つの軸で置く図の `item` の行は課題を宣言する。量の図と列の図と試す図の `item` の行はほかのブロックが受け持つ */
  "head:item": (v) => (v.diagram.matrix?.items.length ?? 0) > 0,
  /** 区画へ課題を置く `line` の行は区画 (`box`) を名指す。列の図の `line` の行は部品 (`part`) を名指す */
  "head:line": (v) => v.diagram.kind === "matrix" && v.events.some((e) => e.type === "line"),
} satisfies BlockUses;
