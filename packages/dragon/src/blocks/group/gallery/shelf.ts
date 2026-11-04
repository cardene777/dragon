/** 編集画面の棚の、区画と箱の部品 (#3345、#3350)。棚の部品の id は `region`。新しい区画を宣言し、箱を 1 つ入れる */
import type { BlockShelf } from "../../gallery";

/** 足す区画の仮の名札の頭と名前。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = {
  ja: { region: "区画", newRegion: "新しい区画" },
  en: { region: "zone", newRegion: "New region" },
} as const;

export const shelf = {
  region: {
    ja: "区画と箱",
    en: "Region with a box",
    build: (d, kit) => {
      const words = WORDS[kit.lang];
      const id = kit.freshId(d, words.region);
      return kit.withBox({ ...d, blocks: { ...d.blocks, group: [...(d.blocks.group ?? []), { id, name: words.newRegion }] } }, id).diagram;
    },
  },
} satisfies BlockShelf;
