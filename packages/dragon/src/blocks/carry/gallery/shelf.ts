/**
 * 編集画面の棚の、運ぶ物を選んだ線の部品 (#3345、#3350)。棚の部品の id は `edge-tag`、`edge-coin`、`edge-none`。
 * 最初の 2 つの箱の間に、札か硬貨を運ぶか、何も運ばない線を 1 本引く
 */
import type { BlockShelf } from "../../gallery";

/** 足す線の仮の名前と札の字。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = {
  ja: { handOver: "渡す", key: "鍵", pay: "払う", notify: "知らせる" },
  en: { handOver: "hand over", key: "key", pay: "pay", notify: "notify" },
} as const;

export const shelf = {
  "edge-tag": {
    ja: "札を運ぶ線",
    en: "Edge carrying a tag",
    build: (d, kit) => kit.withEdge(d, { label: WORDS[kit.lang].handOver, carry: { kind: "tag", text: WORDS[kit.lang].key } }),
  },
  "edge-coin": { ja: "硬貨を運ぶ線", en: "Edge carrying a coin", build: (d, kit) => kit.withEdge(d, { label: WORDS[kit.lang].pay, carry: { kind: "coin" } }) },
  "edge-none": { ja: "何も運ばない線", en: "Edge carrying nothing", build: (d, kit) => kit.withEdge(d, { label: WORDS[kit.lang].notify, carry: { kind: "none" } }) },
} satisfies BlockShelf;
