/** 見本帳の部品の頁の、列の並びの説明 (#3239、#3348、#3531)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "列の図だけの部品。段の中に line <列>: <チップ>, <チップ> と書くと、その列のチップが書いた順に並び直す。ほかの列に居たチップはその席から滑って来て、どこにも居なかったチップは弾んで現れる。1 列は 12 枚まで。",
  en: "Lineup diagrams only. Write line <lane>: <chip>, <chip> in a step and the chips of that lane line up in the order written. A chip that was in another lane slides over from its seat, and a chip that was nowhere pops in. A lane holds up to 12 chips.",
};
