/** 見本帳の一覧の、列の並びの名前と説明 (#3239、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "列の並び",
    desc: "列の図だけの部品。段の中に line <列>: <チップ>, <チップ> と書くと、その列のチップが書いた順に並び直す。ほかの列に居たチップはその席から滑って来て、どこにも居なかったチップは弾んで現れる。1 列は 12 枚まで。",
  },
  en: {
    name: "Lane order",
    desc: "Lineup diagrams only. Write line <lane>: <chip>, <chip> in a step and the chips of that lane line up in the order written. A chip that was in another lane slides over from its seat, and a chip that was nowhere pops in. A lane holds up to 12 chips.",
  },
};
