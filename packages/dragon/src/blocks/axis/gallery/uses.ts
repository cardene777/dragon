/** 見本帳の部品の頁で、2つの軸で置く図の軸の語を使う見本を探す関数 (#3622)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:matrix": (v) => v.diagram.kind === "matrix",
  /** 2つの軸で置く図は軸を必ず 2 本書くので、2つの軸で置く図かで決める */
  "head:axis": (v) => (v.diagram.matrix?.axes.length ?? 0) > 0,
  "attr:axis.from": (v) => (v.diagram.matrix?.axes ?? []).some((axis) => axis.from !== undefined),
  "attr:axis.to": (v) => (v.diagram.matrix?.axes ?? []).some((axis) => axis.to !== undefined),
} satisfies BlockUses;
