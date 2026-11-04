/** 編集画面の棚の、名前を下に置く線の部品 (#3345、#3350)。棚の部品の id は `edge-below`。最初の 2 つの箱の間に、名前を下に置く線を 1 本引く */
import type { BlockShelf } from "../../gallery";

/** 足す線の仮の名前。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = { ja: { call: "呼ぶ" }, en: { call: "call" } } as const;

export const shelf = {
  "edge-below": {
    ja: "名前を下に置く線",
    en: "Edge with its label below",
    build: (d, kit) => kit.withEdge(d, { label: WORDS[kit.lang].call, carry: { kind: "envelope" }, labelSide: "below" }),
  },
} satisfies BlockShelf;
