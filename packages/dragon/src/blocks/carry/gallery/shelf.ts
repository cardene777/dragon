/** 編集画面の棚の、運ぶ物を選んだ線の部品 (#3345)。棚の部品の id は `edge-tag`、`edge-coin`、`edge-none` */
import type { BlockShelf } from "../../gallery";

export const shelf = {
  "edge-tag": { ja: "札を運ぶ線", en: "Edge carrying a tag" },
  "edge-coin": { ja: "硬貨を運ぶ線", en: "Edge carrying a coin" },
  "edge-none": { ja: "何も運ばない線", en: "Edge carrying nothing" },
} satisfies BlockShelf;
