/** 見本帳の部品の頁の、量の目盛りの説明 (#3880)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "上限のある量を、量を持つ箱の下の横の棒で見せる。段ごとに総量を書くと棒が動き、上限を超えた分は赤で伸びる。",
  en: "A bar under the box that holds an amount with a limit. Each step sets the total, and the part over the limit grows in red.",
};
