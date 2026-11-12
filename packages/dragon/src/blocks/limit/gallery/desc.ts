/** 見本帳の部品の頁の、箱の上限の説明 (#3624)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。box <名札> [limit: <数>] と書くと、その箱に並べられる札の数の上限になる。上限は 1 から 12 までで、line の行が上限を超える札を並べると誤りになる。",
  en: "Lineup diagrams only. Write box <id> [limit: <number>] and the box holds at most that many chips. The limit is from 1 to 12, and a line that puts more chips in the box is an error.",
};
