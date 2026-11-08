/** 見本帳の部品の頁の、印の列の説明 (#3165、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "時間軸の図だけの部品。row の行で印の列を上から順に宣言すると、目盛りごとに細い印が並び、針が過ぎた所から塗られる。empty に書いた目盛りは空きの印になり、段の中の mark で印の色を変える。",
  en: "Time diagrams only. Declare rows from top to bottom with row lines; each unit gets a thin mark, filled once the needle passes it. Units listed in empty get an empty mark, and mark inside a step recolors marks.",
};
