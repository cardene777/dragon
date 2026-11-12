/**
 * 点で数える見た目 (`[shape: dots]`、#3635) の誤りの文。量の図と集合の重なりの図が同じ文で断る。
 * 点の数の決まりは `packages/dragon/src/dot-count.ts` が持つ
 */
import { DOTS } from "../../dot-count";
import { list } from "../../read-kit";
import type { NotationLang } from "../../words";

/** 点で数える見た目の誤りの文 */
export interface DotsText {
  /** 点の数が上限を超える段がある。`count` はその段の点の数、`unit` は使った 1 点の件数 */
  tooMany: (count: number, unit: number) => string;
  /** `unit` を `[shape: dots]` でない図に書いた */
  unitNeedsDots: string;
  /** `unit` の値 `value` が 0 より大きい数でない */
  unitAmount: (value: string) => string;
  /** 集合の重なりの図の `shape` に `shapes` のほかの値を書いた */
  vennShape: (shapes: readonly string[]) => string;
}

export const DOTS_TEXT: Readonly<Record<NotationLang, DotsText>> = {
  ja: {
    tooMany: (count, unit) => `点が ${count} 個になる段がある。1 つの段の点は ${DOTS.most} 個までにし、最初の行の [shape: dots, unit: <数>] で 1 点の件数を ${unit} より大きくする`,
    unitNeedsDots: "unit は [shape: dots] の図にだけ書ける。unit は 1 点が表す件数",
    unitAmount: (value) => `${value} は unit に書けない。1 点の件数は 0 より大きい数で、単位を付けずに書く`,
    vennShape: (shapes) => `venn (集合の重なりの図) の shape には ${list(shapes)} だけを書ける。書かなければ円を重ねて描く`,
  },
  en: {
    tooMany: (count, unit) => `A step needs ${count} dots. Keep each step to ${DOTS.most} dots or fewer by making one dot stand for more than ${unit} with [shape: dots, unit: <count>] on the first line`,
    unitNeedsDots: "unit can be written only with [shape: dots]. unit is the count one dot stands for",
    unitAmount: (value) => `${value} cannot be a unit. Write a number larger than 0, without a unit`,
    vennShape: (shapes) => `Write ${list(shapes)} for shape in a set overlap diagram, or leave it out to draw circles`,
  },
};
