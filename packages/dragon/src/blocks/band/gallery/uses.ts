/** 見本帳の部品の頁で、量の帯を使う見本を探す関数 (#3626)。量の帯は行の頭の語を持たないので、量の行き先の図の見本を全て量の帯の見本にする */
import type { BlockUses } from "../../gallery";

export const uses = {
  "kind:sankey": (v) => v.diagram.kind === "sankey",
} satisfies BlockUses;
