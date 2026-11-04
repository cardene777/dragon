/** 使い方の頁の「木の図」の節の、木の図の始め方と葉の段落 (#3348) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "tree",
  ja: [
    "葉の値を親へ畳み上げて1つの根にまとめる構造を段ごとに追う時は、最初の行を `tree <題>` にする。葉と親は段の中に書き、書いた段で箱が現れる。`leaf <名札> [hash: <値>]` が葉で、書いた順に左から並ぶ。`hash` を書くと箱に値を出し、名札は葉の下の札に出す。",
  ],
  en: [
    "To follow, step by step, how the values of leaves fold up through parents into one root, start the first line with `tree <title>`. Leaves and parents are written inside steps, and each box appears in the step that writes it. `leaf <id> [hash: <value>]` is a leaf, and leaves line up from the left in written order. With `hash`, the box shows the value and the id moves to a card below the leaf.",
  ],
};
