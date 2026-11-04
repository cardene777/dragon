/** 編集画面の棚の、箱の中の処理の部品 (#3345、#3350)。棚の部品の id は `action`。最後の段の終わりに、最初の箱の中の処理を足す */
import type { BlockShelf } from "../../gallery";

/** 足す処理の仮の名前。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = { ja: { process: "処理する" }, en: { process: "process" } } as const;

export const shelf = {
  action: {
    ja: "箱の中の処理",
    en: "Action inside a box",
    build: (d, kit) => kit.withEvent(d, { type: "action", box: d.blocks.box?.[0]?.id ?? "", label: WORDS[kit.lang].process }),
  },
} satisfies BlockShelf;
