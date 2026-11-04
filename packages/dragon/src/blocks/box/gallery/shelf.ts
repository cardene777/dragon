/**
 * 編集画面の棚の、箱の部品 (#3345、#3350)。棚の部品の id は `box`。
 * 箱の仮の名札と名前は、線の部品が相手の箱を足す時にも使うので、見本帳が棚の道具 (`ShelfKit`) に持つ
 */
import type { BlockShelf } from "../../gallery";

export const shelf = {
  box: { ja: "箱", en: "Box", build: (d, kit) => kit.withBox(d).diagram },
} satisfies BlockShelf;
