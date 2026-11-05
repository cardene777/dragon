/**
 * ETH の送金のブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。呼び出しの行に `[value: <量> ETH]` を付けると、呼び出しの段で呼んだ者の ETH の槽から呼ばれた者の ETH の槽へ量が移る。
 * ETH はトークンの Contract を持たないので、ETH の管は弁を持たない。処理を借りる呼び出しと、書き込めない呼び出しの内側では書けない。
 * 印は呼び出しの行の属性で、行を読むのは呼び出しの管のブロック (`return`)。
 */
import type { Block } from "../block";

export const block: Block = {
  name: "value",
  rank: 124,
  attach: { how: "ride-on-line", only: "pipe" },
  words: { attrs: { edge: ["value"] } },
};
