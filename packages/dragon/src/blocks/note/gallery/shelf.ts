/** 編集画面の棚の、箱の下の字の書き換えの部品 (#3345、#3350)。棚の部品の id は `swap`。最後の段の終わりに、最初の箱の下の字の書き換えを足す */
import type { BlockShelf } from "../../gallery";

/** 書き換えた後の仮の字。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = { ja: { rewritten: "書き換えた字" }, en: { rewritten: "Rewritten" } } as const;

export const shelf = {
  swap: {
    ja: "箱の下の字の書き換え",
    en: "Rewrite the text under a box",
    build: (d, kit) => kit.withEvent(d, { type: "swap", box: d.blocks.box?.[0]?.id ?? "", text: WORDS[kit.lang].rewritten }),
  },
} satisfies BlockShelf;
