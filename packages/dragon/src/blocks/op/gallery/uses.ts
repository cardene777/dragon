/** 見本帳の部品の頁で、線を起こした操作の番号の語を使う見本を探す関数 (#3720)。鍵は記法の語で、部品の頁はこの順に語を並べる */
import type { BlockUses } from "../../gallery";

export const uses = {
  "attr:edge.op": (v) => v.edges.some((e) => e.op !== undefined),
} satisfies BlockUses;
