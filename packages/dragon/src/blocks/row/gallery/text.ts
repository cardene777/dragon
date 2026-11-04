/** 見本帳の一覧の、印の列の名前と説明 (#3165、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "印の列",
    desc: "時間軸の図だけの部品。row の行で印の列を上から順に宣言すると、目盛りごとに細い印が並び、針が過ぎた所から塗られる。empty に書いた目盛りは空きの印になり、段の中の mark で印の色を変える。",
  },
  en: {
    name: "Row of marks",
    desc: "Time diagrams only. Declare rows from top to bottom with row lines; each unit gets a thin mark, filled once the needle passes it. Units listed in empty get an empty mark, and mark inside a step recolors marks.",
  },
};
