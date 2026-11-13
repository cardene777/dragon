/**
 * 見本帳の部品の頁で、輪を使う見本を探す関数 (#3623)。輪は行の頭の語を持たないので、回り続ける図の見本を全て輪の見本にする。
 * 文字盤を左回りにする `turn` (#3638) は、時計の文字盤の見た目の図だけが書く
 */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:cycle": (v) => v.diagram.kind === "cycle",
  "attr:diagram.turn": (v) => v.diagram.cycle?.turn !== undefined,
} satisfies BlockUses;
