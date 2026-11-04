/**
 * commit のブロック (#3164、#3347)。
 *
 * 枝分かれの図の部品 (`only: git`)。段の中の `commit <名札> on <枝> [hash: <hash>, note: <一言>]` の行で枝の先に commit を積み、
 * hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。
 * `on <枝>` の後ろの `copy <commit>` (当て直し) と `merge <枝>` (merge commit) は、当て直しのブロックと merge commit のブロックの語で、
 * 同じ行に書くのでこのブロックが一緒に読み書きする。
 * 枝分かれの図では、今いる場所の札の名前 (`HEAD`) を枝と commit と箱の名札に使えない。名札を確かめるのは、読む処理が名札を確かめる時に呼ぶ、このブロックの読み方 (`read.ts`) の `reserved` が行う。
 */
import type { Block } from "../block";

export const ON = "on";

/** 枝分かれの図で今いる場所を指す札の名前。枝と commit と箱の名札に使えない */
export const HEAD = "HEAD";

/**
 * 枝分かれの図の commit を積む出来事。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。
 * 当て直し (`copy`) は枝の札を動かさず、merge commit (`merge`) は取り込む枝の先端も親に持つ
 */
export interface GitCommit {
  type: "commit";
  id: string;
  branch: string;
  copy?: string;
  merge?: string;
  hash?: string;
  note?: string;
}

export const block: Block = {
  name: "commit",
  rank: 6,
  attach: { how: "place", only: "git" },
  words: { heads: ["commit"], headRanks: { commit: 89 }, attrs: { commit: ["hash", "note"] } },
  // 枝分かれの図の線の端と、`HEAD` を名札に使えない決まりを持つ
  always: true,
};
