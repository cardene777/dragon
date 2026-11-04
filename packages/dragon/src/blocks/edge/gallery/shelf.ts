/** 編集画面の棚の、封筒が走る線の部品 (#3345、#3350)。棚の部品の id は `edge`。最初の 2 つの箱の間に線を 1 本引く */
import type { BlockShelf } from "../../gallery";

/** 足す線の仮の名前。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = { ja: { call: "呼ぶ" }, en: { call: "call" } } as const;

export const shelf = {
  edge: {
    ja: "線 (封筒が走る)",
    en: "Edge (an envelope runs)",
    build: (d, kit) => kit.withEdge(d, { label: WORDS[kit.lang].call, carry: { kind: "envelope" } }),
  },
} satisfies BlockShelf;
