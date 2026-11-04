/**
 * 編集画面の棚の、中身の帯の値の部品 (#3345、#3350)。棚の部品の id は `strip`。
 * 帯が無ければ欄 1 つの帯を宣言し、最後の段の終わりに最初の欄の値を足す
 */
import type { BlockShelf } from "../../gallery";

/** 足す帯の仮の題と欄の名前と値。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = {
  ja: { stripTitle: "状態", stripField: "値", stripValue: "1" },
  en: { stripTitle: "State", stripField: "value", stripValue: "1" },
} as const;

export const shelf = {
  strip: {
    ja: "帯の値",
    en: "Strip value",
    build: (d, kit) => {
      const words = WORDS[kit.lang];
      const strip = d.blocks.strip ?? { title: words.stripTitle, fields: [words.stripField] };
      return kit.withEvent({ ...d, blocks: { ...d.blocks, strip } }, { type: "strip", field: strip.fields[0] ?? words.stripField, value: words.stripValue });
    },
  },
} satisfies BlockShelf;
