/** 見本帳の部品の頁で、輪を使う見本を探す関数 (#3623)。輪は行の頭の語を持たないので、回り続ける図の見本を全て輪の見本にする */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:cycle": (v) => v.diagram.kind === "cycle",
} satisfies BlockUses;
