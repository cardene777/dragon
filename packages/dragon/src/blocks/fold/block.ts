/**
 * 畳みのブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。呼び出しの行に `[fold]` を付けると、その呼び出しの内側の段を 1 つの箱にまとめ、箱に内側の段の数と、内側の段にしか出ない関係者の数を出す。
 * 畳んだ間はその関係者の列を描かず、箱の段では見えている関係者の槽に内側の変更を差し引いた量を 1 段で出す。再生の部品に置いた図は箱を押すと内側の段を開いて描く。
 * 印は値を持たない呼び出しの行の属性で、行を読むのは呼び出しの管のブロック (`return`)。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "fold",
  rank: 129,
  attach: { how: "ride-on-line", only: "pipe" },
  words: { attrs: { edge: ["fold"] } },
};
